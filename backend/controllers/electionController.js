const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const AuditLog = require('../models/AuditLog');
const { lockElectionResults } = require('./voteController');

// @desc    Create an election
// @route   POST /api/elections
// @access  Private/Admin
const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, type, state, constituencies } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, start date, and end date are required.' });
    }

    const election = await Election.create({
      title, description, startDate, endDate,
      type: type || 'Constituency',
      state: state || '',
      constituencies: constituencies || [],
      organization: req.user.organization || 'Government',
    });

    await AuditLog.create({
      action: 'ELECTION_CREATED',
      details: `Election "${title}" created (Type: ${type || 'Constituency'})`,
      userId: req.user._id,
      entityId: election._id,
      entityModel: 'Election',
      ipAddress: req.ip,
    });

    return res.status(201).json(election);
  } catch (error) {
    console.error('[createElection]', error.message);
    return res.status(500).json({ message: 'Server error creating election.', error: error.message });
  }
};

// @desc    Get elections eligible for the calling user's constituency
// @route   GET /api/elections
// @access  Private
const getElections = async (req, res) => {
  try {
    const userConstituencyId = req.user.constituency?._id || req.user.constituency;
    const userState = req.user.constituency?.state;

    let query = {};
    if (req.user.role !== 'admin') {
      if (userConstituencyId) {
        query = {
          $or: [
            { type: 'National' },
            { type: 'State', state: userState },
            { constituencies: userConstituencyId },
          ],
        };
      } else {
        query = { type: 'National' };
      }
    }

    const elections = await Election.find(query).populate('constituencies', 'name state district');
    return res.json(elections);
  } catch (error) {
    console.error('[getElections]', error.message);
    return res.status(500).json({ message: 'Server error fetching elections.', error: error.message });
  }
};

// @desc    Get single election with candidates
// @route   GET /api/elections/:id
// @access  Private
const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate('constituencies', 'name state district');
    if (!election) return res.status(404).json({ message: 'Election not found.' });

    const userConstituency = req.user.constituency?._id || req.user.constituency;
    const candidateFilter = { election: election._id };

    if (req.user.role !== 'admin' && userConstituency && election.type === 'Constituency') {
      candidateFilter.constituency = userConstituency;
    }

    const candidates = await Candidate.find(candidateFilter).populate('constituency', 'name state district');
    return res.json({ election, candidates });
  } catch (error) {
    console.error('[getElectionById]', error.message);
    return res.status(500).json({ message: 'Server error fetching election details.', error: error.message });
  }
};

// @desc    Get completed elections with final results snapshot
// @route   GET /api/elections/completed
// @access  Public
const getCompletedElections = async (req, res) => {
  try {
    const now = new Date();
    const elections = await Election.find({ endDate: { $lt: now } })
      .populate('constituencies', 'name state district')
      .sort({ endDate: -1 });
    return res.json(elections);
  } catch (error) {
    console.error('[getCompletedElections]', error.message);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Add candidate to election
// @route   POST /api/elections/:id/candidates
// @access  Private/Admin
const addCandidate = async (req, res) => {
  try {
    const { name, party, constituencyId } = req.body;
    const electionId = req.params.id;

    if (!name || !party) {
      return res.status(400).json({ message: 'Candidate name and party are required.' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found.' });

    const targetConstituency = constituencyId || election.constituencies?.[0];
    if (!targetConstituency) return res.status(400).json({ message: 'Constituency required for candidate.' });

    const candidate = await Candidate.create({ name, party, election: electionId, constituency: targetConstituency });

    await AuditLog.create({
      action: 'CANDIDATE_ADDED',
      details: `Candidate ${name} (${party}) added to election "${election.title}"`,
      userId: req.user._id,
      entityId: candidate._id,
      entityModel: 'Candidate',
      ipAddress: req.ip,
    });

    return res.status(201).json(candidate);
  } catch (error) {
    console.error('[addCandidate]', error.message);
    return res.status(500).json({ message: 'Server error adding candidate.', error: error.message });
  }
};

// @desc    End election early — auto-locks results snapshot
// @route   PATCH /api/elections/:id/end
// @access  Private/Admin
const endElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found.' });

    election.endDate = new Date();
    await election.save();

    // Lock results immediately on manual end
    await lockElectionResults(election._id.toString());

    await AuditLog.create({
      action: 'ELECTION_ENDED',
      details: `Election "${election.title}" was ended manually by admin. Results locked.`,
      userId: req.user._id,
      entityId: election._id,
      entityModel: 'Election',
      ipAddress: req.ip,
    });

    const updated = await Election.findById(req.params.id);
    return res.json(updated);
  } catch (error) {
    console.error('[endElection]', error.message);
    return res.status(500).json({ message: 'Server error ending election.' });
  }
};

// @desc    Delete an election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
const deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found.' });

    const title = election.title;
    await Election.findByIdAndDelete(req.params.id);
    await Candidate.deleteMany({ election: req.params.id });
    await Vote.deleteMany({ election: req.params.id });

    await AuditLog.create({
      action: 'ELECTION_DELETED',
      details: `Election "${title}" and all associated candidates/votes were deleted`,
      userId: req.user._id,
      ipAddress: req.ip,
    });

    return res.json({ message: 'Election and all associated data deleted successfully.' });
  } catch (error) {
    console.error('[deleteElection]', error.message);
    return res.status(500).json({ message: 'Server error deleting election.' });
  }
};

// @desc    Delete a candidate
// @route   DELETE /api/elections/:id/candidates/:candidateId
// @access  Private/Admin
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });
    return res.json({ message: 'Candidate removed successfully.' });
  } catch (error) {
    console.error('[deleteCandidate]', error.message);
    return res.status(500).json({ message: 'Server error removing candidate.' });
  }
};

module.exports = {
  createElection, getElections, getElectionById, getCompletedElections,
  addCandidate, endElection, deleteElection, deleteCandidate,
};
