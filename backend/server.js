import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

dotenv.config();
const app = express();

// Security Stack
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use(cookieParser());

// Rate Limiters
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5, message: 'Too many login attempts' });
app.use('/api/auth', authLimiter);

// Routes (you will add)
app.get('/api/health', (req,res) => res.json({ status: 'ApexCore Active', acID: true }));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT, () => console.log(`ApexCore running on ${process.env.PORT}`));
});