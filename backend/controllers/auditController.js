const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    // Return latest 50 logs sorted by newest first
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching audit logs', error: error.message });
  }
};

module.exports = { getAuditLogs };
