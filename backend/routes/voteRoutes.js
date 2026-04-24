const express = require('express');
const router = express.Router();
const { castVote, getResults, getFinalResults, verifyVote, getMyVotingHistory } = require('../controllers/voteController');
const { getTurnoutStats } = require('../controllers/turnoutController');
const { protect, admin } = require('../middleware/authMiddleware');
const { voteLimiter } = require('../middleware/rateLimiter');

router.route('/').post(protect, voteLimiter, castVote);
router.route('/history').get(protect, getMyVotingHistory);
router.route('/results/:electionId').get(getResults);
router.route('/results/:electionId/final').get(getFinalResults);
router.route('/turnout/:electionId').get(protect, admin, getTurnoutStats);
router.route('/verify/:receiptToken').get(verifyVote);

module.exports = router;
