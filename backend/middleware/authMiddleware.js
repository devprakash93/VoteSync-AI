const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc  Protect routes — verifies JWT, attaches req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Populate constituency and booth so controllers have full data
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('constituency', 'name state district pincode')
        .populate('assignedBooth', 'name location maxCapacity currentAssigned');

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided.' });
  }
};

/**
 * @desc  Admin guard — must be used AFTER protect
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

module.exports = { protect, admin };
