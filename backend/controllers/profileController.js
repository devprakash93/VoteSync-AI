const User = require('../models/User');
const VoterActivity = require('../models/VoterActivity');
const Election = require('../models/Election');

// @desc    Get authenticated voter's own profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('constituency', 'name state district pincode')
      .populate('assignedBooth', 'name location maxCapacity currentAssigned');

    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(user);
  } catch (error) {
    console.error('[getMyProfile]', error.message);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

// @desc    Get voter's elections (active + completed relevant to their constituency)
// @route   GET /api/profile/elections
// @access  Private
const getMyElections = async (req, res) => {
  try {
    const userConstituencyId = req.user.constituency?._id || req.user.constituency;
    const userState = req.user.constituency?.state;

    let query = {};
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

    const elections = await Election.find(query)
      .populate('constituencies', 'name state')
      .sort({ endDate: -1 });

    const now = new Date();
    const active    = elections.filter(e => now >= e.startDate && now <= e.endDate);
    const upcoming  = elections.filter(e => now < e.startDate);
    const completed = elections.filter(e => now > e.endDate);

    return res.json({ active, upcoming, completed });
  } catch (error) {
    console.error('[getMyElections]', error.message);
    return res.status(500).json({ message: 'Server error.', error: error.message });
  }
};

module.exports = { getMyProfile, getMyElections };
