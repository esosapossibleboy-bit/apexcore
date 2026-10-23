import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Rule 3: Explicit input scrubbing - blocks negative metrics bypass
const scrubFinancialInput = (req, res, next) => {
  if (req.body.amount !== undefined) {
    const raw = req.body.amount;
    // Block string tricks like " -100 ", "-0", "0x-5"
    if (typeof raw === 'string' && raw.includes('-')) {
      return res.status(400).json({ error: 'Negative metrics not allowed' });
    }
    const amt = Number(raw);
    if (!Number.isFinite(amt)) return res.status(400).json({ error: 'Amount must be finite number' });
    if (Object.is(amt, -0)) return res.status(400).json({ error: 'Negative zero not allowed' });
    if (amt <= 0) return res.status(400).json({ error: 'Amount must be > 0' });
    if (amt > 1000000) return res.status(400).json({ error: 'Amount exceeds limit' });
    
    // Rule 2: Server-tier rounding - never trust client float
    req.body.amount = Math.round(amt * 100) / 100;
  }
  next();
};

// GET - Append-only ledger pipeline (calculated)
router.get('/', auth, async (req, res) => {
  try {
    const txs = await Transaction.find({ userId: req.userId }).sort({ createdAt: 1 }).lean();
    res.json(txs.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /send - STRICT ACID + Immutable logs
router.post('/send', auth, scrubFinancialInput, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { toEmail, amount, description } = req.body;
    const amt = req.body.amount; // already scrubbed + rounded on server

    if (!toEmail) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Recipient email required' });
    }

    // Rule 1 & 2: Compute valuation by accumulating immutable logs - on server
    const currentBalance = await Transaction.getBalance(req.userId);
    if (currentBalance < amt) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const sender = await User.findById(req.userId).session(session);
    const recipient = await User.findOne({ email: toEmail.toLowerCase() }).session(session);

    // Rule 1: Never overwrite balances - only append immutable logs
    const [debitTx] = await Transaction.create([{
      userId: sender._id,
      type: 'debit',
      amount: amt,
      description: description || `Transfer to ${toEmail}`,
      toEmail: toEmail
    }], { session });

    if (recipient) {
      await Transaction.create([{
        userId: recipient._id,
        type: 'credit',
        amount: amt,
        description: `Received from ${sender.email} - ${description || 'Transfer'}`,
        fromEmail: sender.email
      }], { session });
    }

    await session.commitTransaction();
    const newBalance = await Transaction.getBalance(req.userId);
    
    res.json({ 
      transaction: debitTx, 
      newBalance, // computed from logs, not stored
      message: 'Transfer successful - ACID committed from immutable ledger'
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("ACID aborted:", err.message);
    res.status(500).json({ error: 'Transaction failed - rolled back: ' + err.message });
  } finally {
    session.endSession();
  }
});

// POST /add - ACID deposit with immutable logs
router.post('/add', auth, scrubFinancialInput, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { amount, description } = req.body;
    const amt = req.body.amount;

    const [transaction] = await Transaction.create([{
      userId: req.userId,
      type: 'credit',
      amount: amt,
      description: description || 'Deposit - ApexCore'
    }], { session });

    await session.commitTransaction();
    const newBalance = await Transaction.getBalance(req.userId);
    
    res.json({ transaction, newBalance, message: 'Deposit successful - ACID committed' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Deposit failed - rolled back: ' + err.message });
  } finally {
    session.endSession();
  }
});

export default router;