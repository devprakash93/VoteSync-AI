const crypto = require('crypto');
const User = require('../models/User');
const Booth = require('../models/Booth');
const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for the given user ID.
 * 7-day expiry is appropriate for a voting system (not 30d).
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, organization, constituencyId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email.' });

    // Auto-generate a Government-style Voter ID
    const voterId = `IND-${crypto.randomBytes(3).toString('hex').toUpperCase()}-V`;

    let assignedBooth = null;
    if (constituencyId) {
      // Auto-assign to the booth in that constituency with the most remaining capacity
      const booth = await Booth.findOne({ constituency: constituencyId })
        .sort({ currentAssigned: 1 }) // lowest assigned = most remaining capacity
        .where('currentAssigned').lt(800);

      if (booth) {
        assignedBooth = booth._id;
        await Booth.findByIdAndUpdate(booth._id, { $inc: { currentAssigned: 1 } });
      }
    }

    const user = await User.create({
      name,
      email,
      password, // hashed automatically by User model pre-save hook
      role: role || 'voter',
      organization: organization || 'Public',
      voterId,
      constituency: constituencyId || null,
      assignedBooth,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      voterId: user.voterId,
      constituency: user.constituency,
      assignedBooth: user.assignedBooth,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('[Register]', error.message);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        voterId: user.voterId,
        constituency: user.constituency,
        assignedBooth: user.assignedBooth,
        token: generateToken(user._id),
      });
    }

    return res.status(401).json({ message: 'Invalid email or password.' });
  } catch (error) {
    console.error('[Login]', error.message);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  // req.user is already populated by authMiddleware (with constituency + booth)
  const user = req.user;

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    voterId: user.voterId,
    constituency: user.constituency,
    assignedBooth: user.assignedBooth,
  });
};

module.exports = { registerUser, loginUser, getUserProfile };
