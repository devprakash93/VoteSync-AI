const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  party: { type: String, required: true },
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  constituency: { type: mongoose.Schema.Types.ObjectId, ref: 'Constituency', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Candidate', CandidateSchema);
