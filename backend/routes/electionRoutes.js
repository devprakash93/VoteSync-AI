const express = require('express');
const router = express.Router();
const { createElection, getElections, getElectionById, addCandidate, endElection, deleteElection, deleteCandidate } = require('../controllers/electionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, admin, createElection).get(protect, getElections);
router.route('/:id').get(protect, getElectionById).delete(protect, admin, deleteElection);
router.route('/:id/end').patch(protect, admin, endElection);
router.route('/:id/candidates').post(protect, admin, addCandidate);
router.route('/:id/candidates/:candidateId').delete(protect, admin, deleteCandidate);

module.exports = router;
