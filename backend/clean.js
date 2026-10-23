import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Transaction from './models/Transaction.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function clean() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const user = await User.findOne({ email: "john@test.com" });
  if (!user) {
    console.log("User john@test.com not found");
    process.exit();
  }

  // Delete ALL old transactions for this user (including Invalid Date ones)
  const result = await Transaction.deleteMany({ userId: user._id });
  console.log(`Deleted ${result.deletedCount} old transactions`);

  // Recreate clean professional transactions with proper dates
  const cleanTxs = [
    { userId: user._id, type: 'credit', amount: 12450, description: 'Initial Deposit - ApexCore', createdAt: new Date('2026-10-20') },
    { userId: user._id, type: 'credit', amount: 500, description: 'Salary Credit', createdAt: new Date('2026-10-21') },
    { userId: user._id, type: 'debit', amount: 45.50, description: 'Netflix Subscription', createdAt: new Date('2026-10-22') },
    { userId: user._id, type: 'debit', amount: 120, description: 'Transfer to Savings', createdAt: new Date('2026-10-22') },
    { userId: user._id, type: 'credit', amount: 500, description: 'Deposit - ApexCore', createdAt: new Date() },
  ];

  await Transaction.insertMany(cleanTxs);
  console.log("Inserted 5 clean transactions");

  // Recalculate balance from clean transactions
  const total = cleanTxs.reduce((acc, tx) => tx.type === 'credit' ? acc + tx.amount : acc - tx.amount, 0);
  user.balance = total;
  await user.save();
  console.log(`User balance set to $${total.toFixed(2)}`);

  await mongoose.disconnect();
  console.log("Done! Refresh dashboard.");
}

clean();