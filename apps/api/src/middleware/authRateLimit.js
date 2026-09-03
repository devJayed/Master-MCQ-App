const crypto = require('crypto');
const AuthRateLimit = require('../models/AuthRateLimit');

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

module.exports = ({ name, windowMs, max, includeEmail = false }) => async (req, res, next) => {
  try {
    const now = Date.now();
    const bucket = Math.floor(now / windowMs);
    const identity = includeEmail
      ? `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`
      : req.ip;
    const key = `${name}:${bucket}:${digest(identity)}`;
    const entry = await AuthRateLimit.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(max - entry.count, 0)));
    res.set('RateLimit-Reset', String(Math.ceil(entry.expiresAt.getTime() / 1000)));
    if (entry.count > max) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    next();
  } catch (error) {
    next(error);
  }
};
