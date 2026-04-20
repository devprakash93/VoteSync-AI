const mongoose = require('mongoose');

const BoothSchema = new mongoose.Schema({
  name: { type: String, required: true },
  constituency: { type: mongoose.Schema.Types.ObjectId, ref: 'Constituency', required: true },
  location: { type: String },
  maxCapacity: { type: Number, default: 1000 },
  currentAssigned: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Booth', BoothSchema);
