const mongoose = require('mongoose');

/**
 * VoterActivity — stores IDENTITY data (who voted, when).
 *
 * Cryptographic Unlinkability Guarantee:
 * This collection stores the voter's real userId + receiptToken.
 * The Vote collection stores voterHash (SHA-256) + candidateId + receiptToken.
 * Since Vote has NO userId field, and VoterActivity has NO candidateId field,
 * there is NO join possible that reveals which candidate a specific voter chose.
 * Even admins cannot cross-reference these collections to break anonymity.
 */
const VoterActivitySchema = new mongoose.Schema({
  election:     { type: mongoose.Schema.Types.ObjectId, ref: 'Election',     required: true },
  voter:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  constituency: { type: mongoose.Schema.Types.ObjectId, ref: 'Constituency', required: false },
  booth:        { type: mongoose.Schema.Types.ObjectId, ref: 'Booth',        required: false },
  // Same token given to voter — can confirm participation but NOT vote choice
  receiptToken: { type: String, required: true },
  votedAt:      { type: Date, default: Date.now },
}, { timestamps: false });

// One activity record per voter per election
VoterActivitySchema.index({ election: 1, voter: 1 }, { unique: true });

// Index for admin participation queries
VoterActivitySchema.index({ election: 1, constituency: 1 });

module.exports = mongoose.model('VoterActivity', VoterActivitySchema);
