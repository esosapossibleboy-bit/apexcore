import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js'; // FIXED: plural

dotenv.config();
const app = express();

// 1. Helmet - XSS, clickjacking, HSTS - WEEK 5 Security
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 2. CORS - must allow credentials for withCredentials: true pipeline
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));

// 3. Rate limit - brute force protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, try again later' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts - account locked 15min' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 4. MongoDB Secure Connection
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Secure Connected - ACID ready');
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
}

// 5. Routes - Full-stack API pipeline
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// 6. Global error handler - never leak stack
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ApexCore SECURE ACID running on ${PORT}`));