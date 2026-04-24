const VoterActivity = require('../models/VoterActivity');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * @desc  Get voter participation for an election (privacy-safe)
 *        Returns: voterId, constituencyName, boothName, timestamp
 *        NEVER returns: candidate choice, party, vote content
 * @route GET /api/admin/participation/:electionId
 * @access Private/Admin
 */
const getVoterParticipation = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { constituency } = req.query; // optional filter

    const filter = { election: electionId };
    if (constituency) filter.constituency = constituency;

    const activities = await VoterActivity.find(filter)
      .populate('voter', 'name voterId email')
      .populate('constituency', 'name state district')
      .populate('booth', 'name location')
      .sort({ votedAt: -1 });

    // Build privacy-safe response — NO vote choice data
    const participation = activities.map(a => ({
      activityId:       a._id,
      voterId:          a.voter?.voterId || 'N/A',
      voterName:        a.voter?.name || 'Anonymous',
      constituencyName: a.constituency?.name || 'Unknown',
      constituencyState:a.constituency?.state || '',
      boothName:        a.booth?.name || 'Unassigned',
      timestamp:        a.votedAt,
      // Explicitly label that vote choice is hidden
      voteChoice:       '🔒 PROTECTED — Not Accessible',
    }));

    // Log this admin access for accountability
    await AuditLog.create({
      action: 'ADMIN_VIEWED_PARTICIPATION',
      details: `Admin viewed voter participation for election ${electionId} (${participation.length} records returned)`,
      userId: req.user._id,
      entityId: electionId,
      entityModel: 'Election',
      ipAddress: req.ip,
      severity: 'info',
    });

    return res.json({
      electionId,
      totalParticipants: participation.length,
      note: 'Vote choices are cryptographically separated from identity records. This data cannot reveal how anyone voted.',
      participation,
    });
  } catch (error) {
    console.error('[getVoterParticipation]', error.message);
    return res.status(500).json({ message: 'Server error fetching participation data.', error: error.message });
  }
};

/**
 * @desc  Get summary participation stats across all elections
 * @route GET /api/admin/participation-summary
 * @access Private/Admin
 */
const getParticipationSummary = async (req, res) => {
  try {
    const summary = await VoterActivity.aggregate([
      {
        $group: {
          _id: '$election',
          totalVoted: { $sum: 1 },
          latestVote: { $max: '$votedAt' },
        },
      },
      { $sort: { latestVote: -1 } },
    ]);

    // Log admin access
    await AuditLog.create({
      action: 'ADMIN_VIEWED_PARTICIPATION',
      details: `Admin viewed participation summary across all elections`,
      userId: req.user._id,
      ipAddress: req.ip,
      severity: 'info',
    });

    return res.json(summary);
  } catch (error) {
    console.error('[getParticipationSummary]', error.message);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { getVoterParticipation, getParticipationSummary };
