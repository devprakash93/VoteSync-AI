const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');

// @desc    Create an election
// @route   POST /api/elections
// @access  Private/Admin
const createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate, type, state, constituencies } = req.body;

    const election = await Election.create({
      title, description, startDate, endDate,
      type: type || 'Constituency',
      state: state || '',
      constituencies: constituencies || [],
      organization: req.user.organization || 'Government'
    });

    await AuditLog.create({
      action: 'ELECTION_CREATED',
      details: `Election "${title}" created (Type: ${type || 'Constituency'})`,
      userId: req.user._id,
      entityId: election._id,
      entityModel: 'Election',
      ipAddress: req.ip
    });

    res.status(201).json(election);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get elections eligible for the calling user's constituency
// @route   GET /api/elections
// @access  Private
const getElections = async (req, res) => {
  try {
    const userConstituencyId = req.user.constituency;

    let query = {};
    if (userConstituencyId) {
      // Return elections that are National (all), OR specifically include this user's constituency
      query = {
        $or: [
          { type: 'National' },
          { type: 'State', state: req.user.constituencyState },
          { constituencies: userConstituencyId }
        ]
      };
    }

    const elections = await Election.find(query).populate('constituencies', 'name state district');
    res.json(elections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single election details with candidates (filtered by voter's constituency)
// @route   GET /api/elections/:id
// @access  Private
const getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).populate('constituencies', 'name state district');
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Filter candidates to only the requesting user's constituency (Constituency-lock)
    const userConstituency = req.user?.constituency;
    const candidateFilter = { election: election._id };
    if (userConstituency) candidateFilter.constituency = userConstituency;

    const candidates = await Candidate.find(candidateFilter)
      .populate('constituency', 'name state district');
    res.json({ election, candidates });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add candidate to election
// @route   POST /api/elections/:id/candidates
// @access  Private/Admin
const addCandidate = async (req, res) => {
  try {
    const { name, party, constituencyId } = req.body;
    const electionId = req.params.id;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // Require constituency link for government Election architecture
    const targetConstituency = constituencyId || (election.constituencies?.[0]);
    if (!targetConstituency) return res.status(400).json({ message: 'Constituency required for candidate' });

    const candidate = await Candidate.create({
      name, party,
      election: electionId,
      constituency: targetConstituency
    });

    await AuditLog.create({
      action: 'CANDIDATE_ADDED',
      details: `Candidate ${name} (${party}) added to constituency election`,
      userId: req.user._id,
      entityId: candidate._id,
      entityModel: 'Candidate',
      ipAddress: req.ip
    });

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    End election early
// @route   PATCH /api/elections/:id/end
// @access  Private/Admin
const endElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    election.endDate = new Date();
    await election.save();
    
    res.json(election);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete an election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
const deleteElection = async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    await Candidate.deleteMany({ election: req.params.id });
    await require('../models/Vote').deleteMany({ election: req.params.id });

    res.json({ message: 'Election deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a candidate
// @route   DELETE /api/elections/:id/candidates/:candidateId
// @access  Private/Admin
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.candidateId);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    res.json({ message: 'Candidate removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createElection, getElections, getElectionById, addCandidate, endElection, deleteElection, deleteCandidate };
