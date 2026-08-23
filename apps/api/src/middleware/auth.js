const jwt = require('jsonwebtoken');
const User = require('../models/User');
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: 'Sign in required' });
    const { id, sessionVersion } = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
    );
    req.user = await User.findById(id);
    if (!req.user?.isActive || req.user.sessionVersion !== sessionVersion)
      return res.status(401).json({ message: 'Session expired' });
    next();
  } catch {
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
