const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  organization: { type: String, default: 'Government' },
  type: { type: String, enum: ['National', 'State', 'Constituency'], default: 'Constituency' },
  state: { type: String }, // For State-level elections
  constituencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Constituency' }], // Empty = all constituencies
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

// A virtual to easily get the election status based on dates
ElectionSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'Upcoming';
  if (now > this.endDate) return 'Completed';
  return 'Active';
});

ElectionSchema.set('toJSON', { virtuals: true });
ElectionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Election', ElectionSchema);
