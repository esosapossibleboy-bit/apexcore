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

// GET - Append-only ledger pipeline (calculated)
router.get('/', auth, async (req, res) => {
  try {
    // WEEK 5: Append-only ledger pipeline - sorted by creation, never mutated
    const txs = await Transaction.find({ userId: req.userId })
      .sort({ createdAt: 1 }) // Append-only order
      .lean();
    res.json(txs.reverse()); // Show newest first but keep ledger append-only in DB
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /send - STRICT ACID TRANSACTION
router.post('/send', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { toEmail, amount, description } = req.body;
    const amt = Number(amount);
    
    if (!toEmail || !amt || amt <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Valid email and amount > 0 required' });
    }

    // WEEK 5: All DB reads inside session for ACID
    const sender = await User.findById(req.userId).session(session);
    if (!sender) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Sender not found' });
    }
    
    if (sender.balance < amt) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const recipient = await User.findOne({ email: toEmail.toLowerCase() }).session(session);

    // ATOMIC dual account mutation - if hardware/network drops here, both rollback
    sender.balance -= amt;
    await sender.save({ session });

    if (recipient) {
      recipient.balance += amt;
      await recipient.save({ session });
      
      // Ledger entry for recipient
      await Transaction.create([{
        userId: recipient._id,
        type: 'credit',
        amount: amt,
        description: `Received from ${sender.email} - ${description || 'Transfer'}`,
        fromEmail: sender.email
      }], { session });
    }

    // Ledger entry for sender - append-only
    const [transaction] = await Transaction.create([{
      userId: sender._id,
      type: 'debit',
      amount: amt,
      description: description || `Transfer to ${toEmail}`,
      toEmail: toEmail
    }], { session });

    // COMMIT - both accounts + both ledger entries succeed together
    await session.commitTransaction();
    
    res.json({ 
      transaction, 
      newBalance: sender.balance,
      message: 'Transfer successful - ACID committed'
    });

  } catch (err) {
    // WEEK 5: Automatic rollback on any error, hardware drop, network failure
    await session.abortTransaction();
    console.error("ACID Transaction aborted:", err.message);
    res.status(500).json({ error: 'Transaction failed - rolled back: ' + err.message });
  } finally {
    session.endSession();
  }
});

// POST /add - ACID for deposit
router.post('/add', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { amount, description } = req.body;
    const amt = Number(amount);
    
    if (!amt || amt <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Amount must be > 0' });
    }

    const user = await User.findById(req.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    user.balance += amt;
    await user.save({ session });

    const [transaction] = await Transaction.create([{
      userId: user._id,
      type: 'credit',
      amount: amt,
      description: description || 'Deposit - ApexCore'
    }], { session });

    await session.commitTransaction();
    
    res.json({ 
      transaction, 
      newBalance: user.balance,
      message: 'Deposit successful - ACID committed'
    });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Deposit failed - rolled back: ' + err.message });
  } finally {
    session.endSession();
  }
});

export default router;