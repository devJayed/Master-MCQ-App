const express = require('express'),
  cors = require('cors'),
  morgan = require('morgan'),
  connectDb = require('./config/db');
const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'https://master-mcq-app-web.vercel.app',
  ...(process.env.CLIENT_URL || '').split(','),
]
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header are not browser cross-origin requests.
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  req.cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .filter(Boolean)
      .map((part) => part.trim().split('='))
      .map(([key, value]) => [key, decodeURIComponent(value || '')])
  );
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/', (_, res) => res.json({ status: 'ok' }));
// Vercel loads the exported Express app without executing server.js. Ensure
// database-backed routes share and await a cached connection in that runtime.
app.use('/api', async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (error) {
    next(error);
  }
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/chapters', require('./routes/chapter.routes'));
app.use('/api/topics', require('./routes/topic.routes'));
app.use('/api/subtopics', require('./routes/subtopic.routes'));
app.use('/api/syllabus', require('./routes/syllabus.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/attempts', require('./routes/attempt.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.name === 'ValidationError' || err.name === 'CastError' ? 400 : 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});
module.exports = app;
