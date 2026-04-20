const express = require('express');
const router = express.Router();
const { getConstituencies, createConstituency, getBooths, createBooth, getBoothTurnout } = require('../controllers/geoController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/constituencies').get(getConstituencies).post(protect, admin, createConstituency);
router.route('/booths').get(protect, getBooths).post(protect, admin, createBooth);
router.route('/turnout/:electionId').get(protect, admin, getBoothTurnout);

module.exports = router;
