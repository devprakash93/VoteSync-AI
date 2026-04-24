const express = require('express');
const router = express.Router();
const { getVoterParticipation, getParticipationSummary } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All admin routes require valid JWT + admin role
router.get('/participation/:electionId', protect, admin, getVoterParticipation);
router.get('/participation-summary',     protect, admin, getParticipationSummary);

module.exports = router;
