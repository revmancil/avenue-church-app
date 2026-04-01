require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust Render's proxy
app.set('trust proxy', 1);

// Security
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://avenue-church-app.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean).map(o => o.replace(/\/$/, '')); // strip trailing slashes

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', church: process.env.CHURCH_NAME || 'Avenue Progressive Baptist Church' })
);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✝  Avenue Church API listening on port ${PORT} [${process.env.NODE_ENV}]`)
);

module.exports = app;
