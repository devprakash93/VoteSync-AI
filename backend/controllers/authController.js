const crypto = require('crypto');
const User = require('../models/User');
const Booth = require('../models/Booth');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, organization, constituencyId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Auto-generate a Government-style Voter ID
    const voterId = `IND-${crypto.randomBytes(3).toString('hex').toUpperCase()}-V`;

    let assignedBooth = null;
    if (constituencyId) {
      // Auto-assign to the booth in that constituency with the most remaining capacity
      const booth = await Booth.findOne({ constituency: constituencyId })
        .sort({ currentAssigned: 1 }) // lowest assigned = most remaining capacity
        .where('currentAssigned').lt(800); // maxCapacity safety

      if (booth) {
        assignedBooth = booth._id;
        await Booth.findByIdAndUpdate(booth._id, { $inc: { currentAssigned: 1 } });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'voter',
      organization: organization || 'Public',
      voterId,
      constituency: constituencyId || null,
      assignedBooth,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        voterId: user.voterId,
        constituency: user.constituency,
        assignedBooth: user.assignedBooth,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        voterId: user.voterId,
        constituency: user.constituency,
        assignedBooth: user.assignedBooth,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('constituency', 'name state district pincode')
    .populate('assignedBooth', 'name location maxCapacity currentAssigned');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      voterId: user.voterId,
      constituency: user.constituency,
      assignedBooth: user.assignedBooth,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
