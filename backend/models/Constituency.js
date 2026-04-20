const mongoose = require('mongoose');

const ConstituencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  pincode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Constituency', ConstituencySchema);
