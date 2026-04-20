const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['voter', 'admin'], default: 'voter' },
  organization: { type: String, default: 'Public' }, // SaaS Tenant ID (Legacy, repurposing for generic auth logic)
  voterId: { type: String, unique: true, sparse: true }, // Government ID mock
  constituency: { type: mongoose.Schema.Types.ObjectId, ref: 'Constituency' },
  assignedBooth: { type: mongoose.Schema.Types.ObjectId, ref: 'Booth' },
  isVerified: { type: Boolean, default: false } // identity validation mock
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
