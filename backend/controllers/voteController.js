const crypto = require('crypto');
const Vote = require('../models/Vote');
const Election = require('../models/Election');
const AuditLog = require('../models/AuditLog');

// Helper to hash user ID for anonymity
const hashVoterId = (userId, electionId) => {
  return crypto.createHash('sha256').update(`${userId}-${electionId}-${process.env.JWT_SECRET}`).digest('hex');
};

// Helper to hash IP and User-Agent for better ZERO-TRUST fingerprinting
const hashDevice = (ipAddress, userAgent) => {
  return crypto.createHash('sha256').update(`${ipAddress}-${userAgent}-${process.env.JWT_SECRET}`).digest('hex');
};

// @desc    Cast a vote
// @route   POST /api/votes
// @access  Private
const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const userId = req.user._id;
    const userConstituency = req.user.constituency;
    const userBooth = req.user.assignedBooth;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.status !== 'Active') return res.status(400).json({ message: 'Election is not active' });

    // ── Constituency-Lock: Verify voter belongs to this election's constituency ──
    if (election.type === 'Constituency' && election.constituencies?.length > 0) {
      const allowed = election.constituencies.some(c => c.toString() === (userConstituency || '').toString());
      if (!allowed) {
        return res.status(403).json({ message: '🚫 Constituency mismatch. You are not eligible to vote in this election.' });
      }
    }

    // ── Candidate Constituency-Lock ──
    const candidate = await require('../models/Candidate').findById(candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (candidate.constituency && userConstituency && candidate.constituency.toString() !== userConstituency.toString()) {
      return res.status(403).json({ message: '🚫 This candidate does not represent your constituency.' });
    }

    const voterHash = hashVoterId(userId, electionId);
    const ipHash = hashDevice(req.ip, req.headers['user-agent'] || 'unknown');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentIpVotes = await Vote.countDocuments({
      election: electionId, ipHash, createdAt: { $gte: fiveMinutesAgo }
    });

    if (recentIpVotes >= 3) {
      await AuditLog.create({
        action: 'FRAUD_ALERT',
        details: `Anomalous voting frequency from device hash ${ipHash.substring(0, 8)}... (booth: ${userBooth})`,
        entityId: electionId,
        entityModel: 'Election',
        severity: 'critical'
      });
    }

    const receiptToken = require('crypto').randomBytes(16).toString('hex');

    await Vote.create({
      election: electionId,
      candidate: candidateId,
      voterHash,
      ipHash,
      receiptToken,
      constituency: userConstituency || null,
      booth: userBooth || null
    });

    const io = req.app.get('io');
    // Emit two events: one for chart refresh, one for turnout panel refresh
    io.emit('voteCast', { electionId, candidateId, constituencyId: userConstituency });
    io.emit('turnoutUpdate', { electionId, constituencyId: userConstituency, boothId: userBooth });

    await AuditLog.create({
      action: 'VOTE_CAST',
      details: `Vote cast in constituency election (Booth: ${userBooth || 'unassigned'})`,
      ipAddress: req.ip
    });

    res.status(201).json({ message: 'Vote cast successfully', receiptToken });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'User has already voted in this election' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get live results for an election
// @route   GET /api/votes/results/:electionId
// @access  Public
const getResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const results = await Vote.aggregate([
      { $match: { election: new require('mongoose').Types.ObjectId(electionId) } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } }
    ]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify if a vote was safely counted
// @route   GET /api/votes/verify/:receiptToken
// @access  Public
const verifyVote = async (req, res) => {
  try {
    const { receiptToken } = req.params;
    const vote = await Vote.findOne({ receiptToken }).populate('election', 'title').populate('candidate', 'name party');
    
    if (!vote) {
      return res.status(404).json({ message: 'No registered vote found for this receipt. It may be invalid or tampered.' });
    }

    res.json({
      verified: true,
      timestamp: vote.createdAt,
      electionTitle: vote.election.title,
      // For extreme privacy scenarios, you might even hide the candidate name and just say 'Registered'.
      // Exposing the candidate gives voters true verification confidence.
      candidateName: vote.candidate.name
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { castVote, getResults, verifyVote };
