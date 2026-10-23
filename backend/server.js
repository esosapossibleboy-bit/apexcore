import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';

dotenv.config();
const app = express();

// WEEK 6: Production Hardening - trust proxy for Render
app.set('trust proxy', 1);

// 1. Helmet - tight HTTP header layers against clickjacking variants
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' }, // Block clickjacking - REQUIRED
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 2. CORS - production mapping FIXED
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://apexcore-pi.vercel.app',
  'https://apexcore.vercel.app' // add if you have custom domain
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow Postman/no-origin + allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'], // ADDED PUT DELETE OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'] // ADDED Authorization
}));

// 3. Rate Limit - anti-automation on auth profiles
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Prevents password-guessing loops - REQUIRED
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts - locked 15min - anti-automation active' },
  handler: (req, res) => {
    res.status(429).json({ error: 'Brute-force protection triggered - try later' });
  }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 4. MongoDB
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Secure Connected - Production Ready');
} catch (err) {
  console.error('MongoDB failed:', err.message);
  process.exit(1);
}

// 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check for Render
app.get('/health', (req, res) => res.json({ status: 'ApexCore SECURE LIVE', acid: 'ready' }));
app.get('/', (req, res) => res.json({ status: 'ApexCore API LIVE - Week 6 Production' })); // ADDED ROOT

// Global error - never leak stack
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS forbidden' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ApexCore PRODUCTION LIVE on ${PORT}`));