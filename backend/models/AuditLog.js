const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: false },
  entityModel: { type: String, required: false },
  ipAddress: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
