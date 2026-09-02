const PLACEHOLDERS = new Set([
  'replace-with-a-long-random-secret',
  'replace-with-a-different-long-random-secret',
]);

const read = (name) => String(process.env[name] || '').trim();

const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d|w)$/i;
const DURATION_MULTIPLIERS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

const configurationError = (message) => {
  const error = new Error(message);
  error.code = 'AUTH_CONFIGURATION_ERROR';
  return error;
};

const readDuration = (name) => {
  const value = read(name);
  const match = DURATION_PATTERN.exec(value);

  if (!match || Number(match[1]) <= 0) {
    throw configurationError(
      `${name} must be a positive duration such as 15m, 2h, or 7d.`
    );
  }

  const milliseconds = Number(match[1]) * DURATION_MULTIPLIERS[match[2].toLowerCase()];
  if (!Number.isSafeInteger(milliseconds)) {
    throw configurationError(`${name} is too large.`);
  }

  return { value, milliseconds };
};

const getJwtAccessSecret = () => {
  const secret = read('JWT_ACCESS_SECRET') || read('JWT_SECRET');
  if (!secret || PLACEHOLDERS.has(secret)) {
    throw configurationError(
      'Authentication is not configured. Set JWT_ACCESS_SECRET in the API environment.'
    );
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw configurationError('JWT_ACCESS_SECRET must contain at least 32 characters in production.');
  }
  return secret;
};

const getJwtConfig = () => ({
  accessSecret: getJwtAccessSecret(),
  accessExpiresIn: readDuration('JWT_ACCESS_EXPIRES_IN'),
  refreshExpiresIn: readDuration('JWT_REFRESH_EXPIRES_IN'),
});

module.exports = { getJwtAccessSecret, getJwtConfig };
