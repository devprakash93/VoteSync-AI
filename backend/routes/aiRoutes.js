const express = require('express');
const router = express.Router();
const { getAiAnalysis } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/analyze/:electionId').get(protect, admin, getAiAnalysis);

module.exports = router;
