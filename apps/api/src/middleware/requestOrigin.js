const configuredOrigins = () =>
  [
    'http://localhost:3000',
    'https://master-mcq-app-web.vercel.app',
    ...(process.env.CLIENT_URL || '').split(','),
  ]
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const isAllowedOrigin = (origin) => configuredOrigins().includes(String(origin).replace(/\/$/, ''));

const verifyRequestOrigin = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // Bearer-token clients and non-browser clients do not rely on ambient cookie credentials.
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  const origin = req.get('origin');
  if (!origin || isAllowedOrigin(origin)) return next();
  return res.status(403).json({ message: 'Request origin is not allowed.' });
};

module.exports = { configuredOrigins, isAllowedOrigin, verifyRequestOrigin };
