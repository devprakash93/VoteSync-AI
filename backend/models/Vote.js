const mongoose = require('mongoose');
const crypto = require('crypto');

const VoteSchema = new mongoose.Schema({
  election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  // Store an anonymized hash of the User ID instead of the direct ID to maintain secret ballot,
  // while still allowing us to verify they only voted once.
  voterHash: { type: String, required: true },
  ipHash: { type: String, required: true },
  receiptToken: { type: String, required: true, unique: true },
  constituency: { type: mongoose.Schema.Types.ObjectId, ref: 'Constituency' }, // geo-lock tracking
  booth: { type: mongoose.Schema.Types.ObjectId, ref: 'Booth' }               // booth-level turnout analytics
}, { timestamps: true });

// Ensure one vote per user per election
VoteSchema.index({ election: 1, voterHash: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
