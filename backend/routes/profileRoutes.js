const express = require('express');
const router = express.Router();
const { getMyProfile, getMyElections } = require('../controllers/profileController');
const { getMyVotingHistory } = require('../controllers/voteController');
const { protect } = require('../middleware/authMiddleware');

// All profile routes are JWT-protected
router.get('/me',       protect, getMyProfile);
router.get('/history',  protect, getMyVotingHistory);
router.get('/elections',protect, getMyElections);

module.exports = router;
