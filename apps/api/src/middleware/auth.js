const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtAccessSecret } = require('../config/env');
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: 'Sign in required' });
    const { id, sessionVersion } = jwt.verify(
      token,
      getJwtAccessSecret()
    );
    req.user = await User.findById(id);
    if (!req.user?.isActive || req.user.sessionVersion !== sessionVersion)
      return res.status(401).json({ message: 'Session expired' });
    next();
  } catch (error) {
    if (error.code === 'AUTH_CONFIGURATION_ERROR') return next(error);
    res.status(401).json({ message: 'Invalid session' });
  }
};
exports.allow =
  (...roles) =>
  (req, res, next) => {
    // Teachers are the platform administrators and inherit every moderator capability.
    const permitted =
      roles.includes(req.user.role) ||
      (req.user.role === 'teacher' && roles.includes('moderator'));
    return permitted
      ? next()
      : res.status(403).json({ message: 'You do not have access to this action' });
  };
