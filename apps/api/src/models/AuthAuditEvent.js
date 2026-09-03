const mongoose = require('mongoose');

const authAuditEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    emailHash: { type: String, index: true },
    event: { type: String, required: true, index: true },
    ip: String,
    userAgent: String,
    successful: { type: Boolean, required: true },
  },
  { timestamps: true, versionKey: false }
);

authAuditEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuthAuditEvent', authAuditEventSchema);
