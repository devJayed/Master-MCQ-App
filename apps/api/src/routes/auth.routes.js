const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  sendPasswordReset,
  sendEmailVerification,
  sendMfaCode,
} = require('../services/mailer.service');
const { getJwtConfig } = require('../config/env');
const rateLimit = require('../middleware/authRateLimit');
const { validatePassword } = require('../utils/passwordPolicy');
const { recordAuthEvent } = require('../services/authAudit.service');

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const userData = (user) => ({
  id: user._id,
  name: user.nameEnglish || user.name,
  nameEnglish: user.nameEnglish || user.name,
  nameBangla: user.nameBangla || '',
  gender: user.gender || '',
  email: user.email,
  mobileNumber: user.mobileNumber || '',
  role: user.role,
  isActive: user.isActive,
  emailVerified: user.emailVerified !== false,
});
const enabled = (name) => String(process.env[name]).toLowerCase() === 'true';
const publicClientUrl = () =>
  String(process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');
const createEmailVerification = async (user) => {
  const token = crypto.randomBytes(32).toString('base64url');
  user.emailVerificationTokenHash = hash(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendEmailVerification({
    to: user.email,
    verificationUrl: `${publicClientUrl()}/verify-email?token=${token}`,
  });
};
const cookieSameSite = () => {
  const configured = String(process.env.AUTH_COOKIE_SAME_SITE || '').toLowerCase();
  if (['lax', 'strict', 'none'].includes(configured)) return configured;
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
};
const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: cookieSameSite(),
  path: '/',
});
const cookieOptions = (maxAge) => ({
  ...baseCookieOptions(),
  maxAge,
});
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', baseCookieOptions());
  res.clearCookie('refreshToken', baseCookieOptions());
};
const requestMetadata = (req) => ({
  userAgent: String(req.get('user-agent') || '').slice(0, 500),
  ip: req.ip,
});
const createAccessToken = (user) => {
  const { accessSecret, accessExpiresIn } = getJwtConfig();
  return {
    token: jwt.sign(
      { id: user._id, sessionVersion: user.sessionVersion },
      accessSecret,
      { expiresIn: accessExpiresIn.value }
    ),
    maxAge: accessExpiresIn.milliseconds,
  };
};
const issueSession = async (user, res, metadata = {}) => {
  const { refreshExpiresIn } = getJwtConfig();
  const access = createAccessToken(user);
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + refreshExpiresIn.milliseconds);
  const session = {
    tokenHash: hash(refreshToken),
    expiresAt,
    createdAt: metadata.createdAt || new Date(),
    lastUsedAt: new Date(),
    userAgent: metadata.userAgent,
    ip: metadata.ip,
  };
  const now = new Date();
  await User.updateOne(
    { _id: user._id },
    { $pull: { refreshTokens: { expiresAt: { $lte: now } } } }
  );
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { $each: [session], $slice: -5 } } }
  );
  res.cookie('accessToken', access.token, cookieOptions(access.maxAge));
  res.cookie('refreshToken', refreshToken, cookieOptions(refreshExpiresIn.milliseconds));
};
const normalizeMobile = (value) => {
  const compact = String(value || '').replace(/[\s()-]/g, '');
  if (/^01[3-9]\d{8}$/.test(compact)) return `+88${compact}`;
  if (/^8801[3-9]\d{8}$/.test(compact)) return `+${compact}`;
  return /^\+8801[3-9]\d{8}$/.test(compact) ? compact : '';
};

router.post('/register', rateLimit({ name: 'register', windowMs: 15 * 60 * 1000, max: 5, includeEmail: true }), async (req, res, next) => {
  try {
    const nameEnglish = String(req.body.nameEnglish || '').trim(),
      nameBangla = String(req.body.nameBangla || '').trim();
    const email = String(req.body.email || '')
        .trim()
        .toLowerCase(),
      mobileNumber = normalizeMobile(req.body.mobileNumber),
      gender = String(req.body.gender || '').trim().toLowerCase(),
      password = String(req.body.password || ''),
      confirmPassword = String(req.body.confirmPassword || '');
    if (!['male', 'female', 'other'].includes(gender))
      return res.status(400).json({ message: 'Please select a valid gender.' });
    if (
      nameEnglish.length < 2 ||
      nameBangla.length < 2 ||
      !/[A-Za-z]/.test(nameEnglish) ||
      !/[\u0980-\u09FF]/.test(nameBangla) ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      !mobileNumber ||
      validatePassword(password)
    )
      return res.status(400).json({
        message:
          'Enter valid Bangla and English names, email, Bangladesh mobile number, and a password of at least 8 characters containing a letter and number.',
      });
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Password confirmation does not match.' });
    if (await User.exists({ email }))
      return res.status(409).json({ message: 'Email already registered' });
    if (await User.exists({ mobileNumber }))
      return res.status(409).json({ message: 'Mobile number already registered' });
    // Public registration is always student; privileged roles are provisioned by an administrator.
    const user = await User.create({
      name: nameEnglish,
      nameEnglish,
      nameBangla,
      gender,
      email,
      mobileNumber,
      password,
      role: 'student',
      emailVerified: !enabled('REQUIRE_EMAIL_VERIFICATION'),
    });
    if (!user.emailVerified) {
      await createEmailVerification(user);
      await recordAuthEvent(req, 'register', { user, email, successful: true });
      return res.status(201).json({ data: { verificationRequired: true } });
    }
    await issueSession(user, res, requestMetadata(req));
    await recordAuthEvent(req, 'register', { user, email, successful: true });
    res.status(201).json({ data: { user: userData(user) } });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({
        message: error.keyPattern?.mobileNumber
          ? 'Mobile number already registered'
          : 'Email already registered',
      });
    next(error);
  }
});

router.post('/login', rateLimit({ name: 'login', windowMs: 15 * 60 * 1000, max: 8, includeEmail: true }), async (req, res, next) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive || !(await user.comparePassword(String(req.body.password || '')))) {
      await recordAuthEvent(req, 'login', { user, email, successful: false });
      return res.status(401).json({ message: 'Incorrect email or password' });
    }
    if (enabled('REQUIRE_EMAIL_VERIFICATION') && user.emailVerified === false) {
      return res.status(403).json({ message: 'Verify your email before signing in.' });
    }
    if (enabled('REQUIRE_PRIVILEGED_MFA') && ['teacher', 'moderator'].includes(user.role)) {
      const code = String(crypto.randomInt(100000, 1000000));
      const challenge = crypto.randomBytes(32).toString('base64url');
      user.mfaChallengeHash = hash(challenge);
      user.mfaCodeHash = hash(code);
      user.mfaExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save({ validateBeforeSave: false });
      await sendMfaCode({ to: user.email, code });
      return res.status(202).json({ data: { mfaRequired: true, challenge } });
    }
    await issueSession(user, res, requestMetadata(req));
    await recordAuthEvent(req, 'login', { user, email, successful: true });
    res.json({ data: { user: userData(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', rateLimit({ name: 'refresh', windowMs: 15 * 60 * 1000, max: 60 }), async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'Session expired' });
    const now = new Date();
    const currentHash = hash(refreshToken);
    const rotatedToken = crypto.randomBytes(48).toString('base64url');
    const rotatedHash = hash(rotatedToken);
    const metadata = requestMetadata(req);
    const user = await User.findOneAndUpdate(
      {
        isActive: true,
        refreshTokens: {
          $elemMatch: { tokenHash: currentHash, expiresAt: { $gt: now } },
        },
      },
      {
        $set: {
          'refreshTokens.$.tokenHash': rotatedHash,
          'refreshTokens.$.lastUsedAt': now,
          'refreshTokens.$.userAgent': metadata.userAgent,
          'refreshTokens.$.ip': metadata.ip,
        },
      },
      { new: true, runValidators: true }
    ).select('+refreshTokens.tokenHash');
    const session = user?.refreshTokens.find((entry) => entry.tokenHash === rotatedHash);
    if (!user || !session) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session expired' });
    }
    const access = createAccessToken(user);
    const refreshMaxAge = Math.max(session.expiresAt.getTime() - now.getTime(), 0);
    res.cookie('accessToken', access.token, cookieOptions(access.maxAge));
    res.cookie('refreshToken', rotatedToken, cookieOptions(refreshMaxAge));
    res.json({ data: { user: userData(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/login/mfa', rateLimit({ name: 'login-mfa', windowMs: 15 * 60 * 1000, max: 8 }), async (req, res, next) => {
  try {
    const challenge = String(req.body.challenge || '');
    const code = String(req.body.code || '');
    const user = await User.findOne({
      mfaChallengeHash: hash(challenge),
      mfaCodeHash: hash(code),
      mfaExpiresAt: { $gt: new Date() },
      isActive: true,
    }).select('+mfaChallengeHash +mfaCodeHash');
    if (!user) return res.status(401).json({ message: 'The sign-in code is invalid or expired.' });
    user.mfaChallengeHash = undefined;
    user.mfaCodeHash = undefined;
    user.mfaExpiresAt = undefined;
    await issueSession(user, res, requestMetadata(req));
    await recordAuthEvent(req, 'mfa-login', { user, successful: true });
    res.json({ data: { user: userData(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-email', rateLimit({ name: 'verify-email', windowMs: 15 * 60 * 1000, max: 10 }), async (req, res, next) => {
  try {
    const token = String(req.body.token || '');
    const user = await User.findOne({
      emailVerificationTokenHash: hash(token),
      emailVerificationExpiresAt: { $gt: new Date() },
    }).select('+emailVerificationTokenHash');
    if (!user) return res.status(400).json({ message: 'Verification link is invalid or expired.' });
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await issueSession(user, res, requestMetadata(req));
    await recordAuthEvent(req, 'email-verify', { user, successful: true });
    res.json({ data: { user: userData(user) } });
  } catch (error) {
    next(error);
  }
});

router.post('/resend-verification', rateLimit({ name: 'resend-verification', windowMs: 60 * 60 * 1000, max: 3, includeEmail: true }), async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email, emailVerified: false }).select(
      '+emailVerificationTokenHash'
    );
    if (user) await createEmailVerification(user);
    res.json({ message: 'If verification is required, a new link has been sent.' });
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
  await recordAuthEvent(req, 'logout', { successful: true });
  res.status(204).end();
});

router.post('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(String(currentPassword || ''))))
      return res.status(401).json({ message: 'Current password is incorrect' });
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });
    user.password = newPassword;
    user.sessionVersion += 1;
    user.refreshTokens = [];
    await user.save();
    clearAuthCookies(res);
    await recordAuthEvent(req, 'password-change', { user, successful: true });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/forgot-password', rateLimit({ name: 'forgot-password', windowMs: 60 * 60 * 1000, max: 3, includeEmail: true }), async (req, res, next) => {
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

router.post('/reset-password', rateLimit({ name: 'reset-password', windowMs: 15 * 60 * 1000, max: 5 }), async (req, res, next) => {
  try {
    const token = String(req.body.token || ''),
      password = String(req.body.password || ''),
      confirmPassword = String(req.body.confirmPassword || '');
    if (!token || validatePassword(password))
      return res.status(400).json({ message: 'Reset link or new password is invalid.' });
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Password confirmation does not match.' });
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
    await recordAuthEvent(req, 'password-reset', { user, successful: true });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, (req, res) => res.json({ data: userData(req.user) }));
router.get('/sessions', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshTokens.tokenHash');
    const currentHash = req.cookies.refreshToken ? hash(req.cookies.refreshToken) : null;
    const sessions = user.refreshTokens
      .filter((session) => session.expiresAt > new Date())
      .map((session) => ({
        id: session._id,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent || '',
        ip: session.ip || '',
        current: Boolean(currentHash && session.tokenHash === currentHash),
      }));
    res.json({ data: sessions });
  } catch (error) {
    next(error);
  }
});
router.delete('/sessions/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshTokens.tokenHash');
    const session = user.refreshTokens.id(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    const current = req.cookies.refreshToken && session.tokenHash === hash(req.cookies.refreshToken);
    session.deleteOne();
    await user.save();
    if (current) clearAuthCookies(res);
    await recordAuthEvent(req, 'session-revoke', { user, successful: true });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
module.exports = router;
