const crypto = require('crypto');
const AuthAuditEvent = require('../models/AuthAuditEvent');

const recordAuthEvent = async (req, event, { user, email, successful }) => {
  try {
    await AuthAuditEvent.create({
      userId: user?._id,
      emailHash: email
        ? crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex')
        : undefined,
      event,
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
      successful,
    });
  } catch (error) {
    console.error('Unable to record authentication audit event:', error);
  }
};

module.exports = { recordAuthEvent };
