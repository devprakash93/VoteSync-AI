const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String },
  organization: { type: String, default: 'Government' },
  type:         { type: String, enum: ['National', 'State', 'Constituency'], default: 'Constituency' },
  state:        { type: String },
  constituencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Constituency' }],
  startDate:    { type: Date, required: true },
  endDate:      { type: Date, required: true },
  isActive:     { type: Boolean, default: false },

  // ── Results Snapshot ──────────────────────────────────────────────────────
  // Written ONCE when election ends. After this is set, all result queries
  // use this snapshot instead of live aggregation — prevents tampering.
  finalResultsSnapshot: [{
    candidateId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    candidateName: { type: String },
    party:         { type: String },
    votes:         { type: Number },
    voteSharePct:  { type: String },
  }],
  resultsLockedAt: { type: Date, default: null },
  totalVotesCast:  { type: Number, default: 0 },
  turnoutPct:      { type: String, default: '0' },

}, { timestamps: true });

// Virtual status derived from dates
ElectionSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startDate) return 'Upcoming';
  if (now > this.endDate) return 'Completed';
  return 'Active';
});

ElectionSchema.set('toJSON', { virtuals: true });
ElectionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Election', ElectionSchema);
