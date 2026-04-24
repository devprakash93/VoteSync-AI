const crypto = require('crypto');
const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const VoterActivity = require('../models/VoterActivity');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// ── Helpers ────────────────────────────────────────────────────────────────

const hashVoterId = (userId, electionId) =>
  crypto.createHash('sha256')
    .update(`${userId}-${electionId}-${process.env.JWT_SECRET}`)
    .digest('hex');

const hashDevice = (ipAddress, userAgent) =>
  crypto.createHash('sha256')
    .update(`${ipAddress}-${userAgent}-${process.env.JWT_SECRET}`)
    .digest('hex');

/**
 * Lock election results into an immutable snapshot.
 * Called internally when an election ends (time-based or admin action).
 * @param {string} electionId
 */
const lockElectionResults = async (electionId) => {
  try {
    const election = await Election.findById(electionId);
    if (!election || election.resultsLockedAt) return; // already locked

    const totalVotes = await Vote.countDocuments({ election: electionId });

    // Aggregate votes per candidate
    const voteAgg = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Enrich with candidate names
    const candidateIds = voteAgg.map(v => v._id);
    const candidates = await Candidate.find({ _id: { $in: candidateIds } });

    const snapshot = voteAgg.map(v => {
      const cand = candidates.find(c => c._id.toString() === v._id?.toString());
      return {
        candidateId:   cand?._id || v._id,
        candidateName: cand?.name || 'Unknown',
        party:         cand?.party || 'Unknown',
        votes:         v.count,
        voteSharePct:  totalVotes > 0 ? ((v.count / totalVotes) * 100).toFixed(2) : '0.00',
      };
    });

    // Calculate overall turnout
    const votersByConstituency = await User.aggregate([
      { $match: { role: 'voter', constituency: { $ne: null } } },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]);
    const totalRegistered = votersByConstituency[0]?.total || 0;
    const turnoutPct = totalRegistered > 0
      ? ((totalVotes / totalRegistered) * 100).toFixed(1)
      : '0';

    await Election.findByIdAndUpdate(electionId, {
      finalResultsSnapshot: snapshot,
      resultsLockedAt: new Date(),
      totalVotesCast: totalVotes,
      turnoutPct,
    });

    await AuditLog.create({
      action: 'RESULTS_LOCKED',
      details: `Results for election "${election.title}" were frozen (${totalVotes} votes, ${snapshot.length} candidates).`,
      entityId: electionId,
      entityModel: 'Election',
      severity: 'info',
    });
  } catch (err) {
    console.error('[lockElectionResults]', err.message);
  }
};

// @desc    Cast a vote
// @route   POST /api/votes
// @access  Private
const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;

    if (!electionId || !candidateId) {
      return res.status(400).json({ message: 'electionId and candidateId are required.' });
    }

    const userId        = req.user._id;
    const userConstituency = req.user.constituency?._id || req.user.constituency;
    const userBooth        = req.user.assignedBooth?._id || req.user.assignedBooth;

    // ── Validate Election ────────────────────────────────────────────────
    const election = await Election.findById(electionId).populate('constituencies', 'name');
    if (!election) return res.status(404).json({ message: 'Election not found.' });
    if (election.status !== 'Active') {
      return res.status(400).json({ message: `Election is not active (status: ${election.status}).` });
    }

    // ── Constituency-Lock ────────────────────────────────────────────────
    if (election.type === 'Constituency' && election.constituencies?.length > 0) {
      const allowed = election.constituencies.some(
        (c) => c._id.toString() === (userConstituency || '').toString()
      );
      if (!allowed) {
        return res.status(403).json({ message: 'Constituency mismatch. You are not eligible to vote in this election.' });
      }
    }

    // ── Candidate Validation ─────────────────────────────────────────────
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });

    if (
      candidate.constituency &&
      userConstituency &&
      candidate.constituency.toString() !== userConstituency.toString()
    ) {
      return res.status(403).json({ message: 'This candidate does not represent your constituency.' });
    }

    // ── Hashing ──────────────────────────────────────────────────────────
    const voterHash = hashVoterId(userId, electionId);
    const ipHash    = hashDevice(req.ip, req.headers['user-agent'] || 'unknown');

    // ── Burst Fraud Detection ────────────────────────────────────────────
    const fiveMinutesAgo  = new Date(Date.now() - 5 * 60 * 1000);
    const recentIpVotes   = await Vote.countDocuments({ election: electionId, ipHash, createdAt: { $gte: fiveMinutesAgo } });

    if (recentIpVotes >= 3) {
      await AuditLog.create({
        action: 'FRAUD_ALERT',
        details: `Anomalous voting frequency from device hash ${ipHash.substring(0, 8)}...`,
        entityId: electionId,
        entityModel: 'Election',
        severity: 'critical',
      });
    }

    // ── Record Vote (anonymized) ─────────────────────────────────────────
    const receiptToken = crypto.randomBytes(16).toString('hex');

    await Vote.create({
      election: electionId,
      candidate: candidateId,
      voterHash,
      ipHash,
      receiptToken,
      constituency: userConstituency || null,
      booth: userBooth || null,
    });

    // ── Record Activity (identity only — zero vote linkage) ──────────────
    await VoterActivity.create({
      election:     electionId,
      voter:        userId,
      constituency: userConstituency || null,
      booth:        userBooth || null,
      receiptToken,
      votedAt:      new Date(),
    });

    // ── Real-Time Broadcast ──────────────────────────────────────────────
    const io = req.app.get('io');
    io.emit('voteCast',     { electionId, candidateId, constituencyId: userConstituency });
    io.emit('turnoutUpdate',{ electionId, constituencyId: userConstituency, boothId: userBooth });

    // ── Audit Log ────────────────────────────────────────────────────────
    await AuditLog.create({
      action: 'VOTE_CAST',
      details: `Vote cast in election "${election.title}"`,
      ipAddress: req.ip,
      userId,
    });

    // ── Return richer confirmation (no candidate info) ───────────────────
    const constituencyName = req.user.constituency?.name || '';
    const boothName        = req.user.assignedBooth?.name || '';

    return res.status(201).json({
      message: 'Vote cast successfully.',
      receiptToken,
      confirmation: {
        electionTitle:    election.title,
        electionType:     election.type,
        constituencyName,
        boothName,
        timestamp:        new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted in this election.' });
    }
    console.error('[castVote]', error.message);
    return res.status(500).json({ message: 'Server error while casting vote.', error: error.message });
  }
};

// @desc    Get live results for an active election
// @route   GET /api/votes/results/:electionId
// @access  Public
const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const results = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
    ]);
    return res.json(results);
  } catch (error) {
    console.error('[getResults]', error.message);
    return res.status(500).json({ message: 'Server error fetching results.', error: error.message });
  }
};

// @desc    Get FINAL (locked) results for a completed election
// @route   GET /api/votes/results/:electionId/final
// @access  Public
const getFinalResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId)
      .populate('constituencies', 'name state district');

    if (!election) return res.status(404).json({ message: 'Election not found.' });

    // If not yet locked but completed, lock now on-demand
    if (!election.resultsLockedAt && election.status === 'Completed') {
      await lockElectionResults(electionId);
      const fresh = await Election.findById(electionId).populate('constituencies', 'name state district');
      return res.json({ election: fresh, snapshot: fresh.finalResultsSnapshot });
    }

    return res.json({
      election,
      snapshot: election.finalResultsSnapshot || [],
    });
  } catch (error) {
    console.error('[getFinalResults]', error.message);
    return res.status(500).json({ message: 'Server error fetching final results.', error: error.message });
  }
};

// @desc    Verify a receipt token
// @route   GET /api/votes/verify/:receiptToken
// @access  Public
const verifyVote = async (req, res) => {
  try {
    const { receiptToken } = req.params;
    const vote = await Vote.findOne({ receiptToken })
      .populate('election', 'title')
      .populate('candidate', 'name party');

    if (!vote) {
      return res.status(404).json({ message: 'No registered vote found for this receipt. It may be invalid or tampered.' });
    }

    return res.json({
      verified:      true,
      timestamp:     vote.createdAt,
      electionTitle: vote.election?.title,
      candidateName: vote.candidate?.name,
    });
  } catch (error) {
    console.error('[verifyVote]', error.message);
    return res.status(500).json({ message: 'Server error verifying vote.', error: error.message });
  }
};

// @desc    Get the authenticated voter's own participation history
// @route   GET /api/votes/history
// @access  Private (voter)
const getMyVotingHistory = async (req, res) => {
  try {
    const activities = await VoterActivity.find({ voter: req.user._id })
      .populate('election', 'title type startDate endDate status')
      .populate('constituency', 'name state')
      .sort({ votedAt: -1 });

    // Return participation records — no candidate/party data exposed
    const history = activities.map(a => ({
      _id:             a._id,
      electionId:      a.election?._id,
      electionTitle:   a.election?.title,
      electionType:    a.election?.type,
      electionStatus:  a.election?.status,
      startDate:       a.election?.startDate,
      endDate:         a.election?.endDate,
      constituencyName:a.constituency?.name,
      constituencyState:a.constituency?.state,
      votedAt:         a.votedAt,
      receiptToken:    a.receiptToken,
      participated:    true,
    }));

    return res.json(history);
  } catch (error) {
    console.error('[getMyVotingHistory]', error.message);
    return res.status(500).json({ message: 'Server error fetching voting history.', error: error.message });
  }
};

module.exports = {
  castVote,
  getResults,
  getFinalResults,
  verifyVote,
  getMyVotingHistory,
  lockElectionResults,
};
