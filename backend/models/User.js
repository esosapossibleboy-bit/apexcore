import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  mfaSecret: { type: String, required: true },
  balance: { type: Number, default: 12450 }, // Initial deposit
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Number, default: null }
}, { timestamps: true });

export default mongoose.model('User', userSchema);