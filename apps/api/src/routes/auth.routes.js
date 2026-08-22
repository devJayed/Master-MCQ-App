const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendPasswordReset } = require('../services/mailer.service');

const ACCESS_TTL = '120m';
const REFRESH_DAYS = 7;
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const userData = (user) => ({
  id: user._id,
  name: user.nameEnglish || user.name,
  nameEnglish: user.nameEnglish || user.name,
  nameBangla: user.nameBangla || '',
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};
const issueSession = async (user, res) => {
  const accessToken = jwt.sign(
    { id: user._id, sessionVersion: user.sessionVersion },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 86400000);
  user.refreshTokens = (user.refreshTokens || [])
    .filter((entry) => entry.expiresAt > new Date())
    .slice(-4);
  user.refreshTokens.push({ tokenHash: hash(refreshToken), expiresAt });
  await user.save();
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie('refreshToken', refreshToken, cookieOptions(REFRESH_DAYS * 86400000));
};
const limiter = (windowMs, max) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;
    const now = Date.now(),
      entry = hits.get(key);
    if (!entry || entry.expiresAt <= now) hits.set(key, { count: 1, expiresAt: now + windowMs });
    else if (++entry.count > max)
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    next();
  };
};

router.post('/register', async (req, res, next) => {
  try {
    const nameEnglish = String(req.body.nameEnglish || '').trim(),
      nameBangla = String(req.body.nameBangla || '').trim();
    const email = String(req.body.email || '')
        .trim()
        .toLowerCase(),
      password = String(req.body.password || '');
    if (
      nameEnglish.length < 2 ||
      nameBangla.length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8
    )
      return res
        .status(400)
        .json({
          message:
            'Enter Bangla and English names, a valid email, and a password of at least 8 characters.',
        });
    if (await User.exists({ email }))
      return res.status(409).json({ message: 'Email already registered' });
    // Public registration is always student; privileged roles are provisioned by an administrator.
    const user = await User.create({
      name: nameEnglish,
      nameEnglish,
      nameBangla,
      email,
      password,
      role: 'student',
    });
    await issueSession(user, res);
    res.status(201).json({ data: { user: userData(user) } });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    next(error);
  }
});

router.post('/login', limiter(15 * 60 * 1000, 8), async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive || !(await user.comparePassword(String(req.body.password || ''))))
      return res.status(401).json({ message: 'Incorrect email or password' });
    await issueSession(user, res);
    res.json({ data: { user: userData(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Session expired' });
    const user = await User.findOne({ 'refreshTokens.tokenHash': hash(refreshToken) }).select(
      '+refreshTokens'
    );
    const session = user?.refreshTokens.find(
      (entry) => entry.tokenHash === hash(refreshToken) && entry.expiresAt > new Date()
    );
    if (!user || !user.isActive || !session) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired' });
    }
    user.refreshTokens = user.refreshTokens.filter(
      (entry) => entry.tokenHash !== hash(refreshToken)
    );
    await issueSession(user, res);
    res.json({ data: { user: userData(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res) => {
  const value = req.cookies.refreshToken;
  if (value)
    await User.updateOne(
      { 'refreshTokens.tokenHash': hash(value) },
      { $pull: { refreshTokens: { tokenHash: hash(value) } } }
    );
  clearAuthCookies(res);
  res.status(204).end();
});

router.post('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(String(currentPassword || ''))))
      return res.status(401).json({ message: 'Current password is incorrect' });
    if (String(newPassword || '').length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    user.password = newPassword;
    user.sessionVersion += 1;
    user.refreshTokens = [];
    await user.save();
    clearAuthCookies(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', limiter(60 * 60 * 1000, 3), async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email }).select('+passwordResetTokenHash');
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = hash(rawToken);
      user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      const client = process.env.CLIENT_URL || 'http://localhost:3000';
      await sendPasswordReset({
        to: user.email,
        resetUrl: `${client}/reset-password?token=${rawToken}`,
      });
    }
    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token || ''),
      password = String(req.body.password || '');
    if (!token || password.length < 8)
      return res.status(400).json({ message: 'Reset link or new password is invalid.' });
    const user = await User.findOne({
      passwordResetTokenHash: hash(token),
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetTokenHash');
    if (!user)
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.sessionVersion += 1;
    user.refreshTokens = [];
    await user.save();
    clearAuthCookies(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, (req, res) => res.json({ data: userData(req.user) }));
module.exports = router;
