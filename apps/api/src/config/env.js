const PLACEHOLDERS = new Set([
  'replace-with-a-long-random-secret',
  'replace-with-a-different-long-random-secret',
]);

const read = (name) => String(process.env[name] || '').trim();

const getJwtAccessSecret = () => {
  const secret = read('JWT_ACCESS_SECRET') || read('JWT_SECRET');
  if (!secret || PLACEHOLDERS.has(secret)) {
    const error = new Error(
      'Authentication is not configured. Set JWT_ACCESS_SECRET in the API environment.'
    );
    error.code = 'AUTH_CONFIGURATION_ERROR';
    throw error;
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    const error = new Error('JWT_ACCESS_SECRET must contain at least 32 characters in production.');
    error.code = 'AUTH_CONFIGURATION_ERROR';
    throw error;
  }
  return secret;
};

module.exports = { getJwtAccessSecret };
