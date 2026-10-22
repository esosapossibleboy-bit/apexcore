import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountNumber: { type: String, unique: true, required: true },
  balance: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'EUR' },
  version: { type: Number, default: 0 } // for race condition prevention
}, { timestamps: true });

accountSchema.index({ accountNumber: 1 });

export default mongoose.model('Account', accountSchema);