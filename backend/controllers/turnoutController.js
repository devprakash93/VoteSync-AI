const mongoose = require('mongoose');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Constituency = require('../models/Constituency');

// @desc  Get live turnout stats for an election
// @route GET /api/votes/turnout/:electionId
// @access Private/Admin
const getTurnoutStats = async (req, res) => {
  try {
    const { electionId } = req.params;

    // Total votes cast in this election
    const totalVotes = await Vote.countDocuments({ election: electionId });

    // Votes grouped by constituency
    const byConstituency = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$constituency', count: { $sum: 1 } } }
    ]);

    // Votes grouped by booth
    const byBooth = await Vote.aggregate([
      { $match: { election: new mongoose.Types.ObjectId(electionId) } },
      { $group: { _id: '$booth', count: { $sum: 1 } } }
    ]);

    // Total registered voters per constituency (from User model)
    const votersByConstituency = await User.aggregate([
      { $match: { role: 'voter', constituency: { $ne: null } } },
      { $group: { _id: '$constituency', total: { $sum: 1 } } }
    ]);

    // Enrich with constituency names
    const constituencyIds = byConstituency.map(b => b._id).filter(Boolean);
    const constDetails = await Constituency.find({ _id: { $in: constituencyIds } });

    const constituencyStats = byConstituency.map(b => {
      const info = constDetails.find(c => c._id.toString() === (b._id || '').toString());
      const voterRow = votersByConstituency.find(v => v._id?.toString() === (b._id || '').toString());
      const totalRegistered = voterRow ? voterRow.total : 0;
      return {
        constituencyId: b._id,
        name: info ? info.name : 'Unknown',
        state: info ? info.state : '',
        votesCast: b.count,
        totalRegistered,
        turnoutPct: totalRegistered > 0 ? ((b.count / totalRegistered) * 100).toFixed(1) : '0'
      };
    });

    // Grand total registered voters
    const totalRegisteredVoters = votersByConstituency.reduce((sum, v) => sum + v.total, 0);
    const overallTurnoutPct = totalRegisteredVoters > 0
      ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(1)
      : '0';

    res.json({
      totalVotes,
      totalRegisteredVoters,
      overallTurnoutPct,
      byConstituency: constituencyStats,
      byBooth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getTurnoutStats };
