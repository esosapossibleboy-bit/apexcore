import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  fromAccount: { type: String, required: true },
  toAccount: { type: String, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  type: { type: String, enum: ['TRANSFER', 'DEPOSIT'], required: true },
  status: { type: String, enum: ['PENDING', 'COMMITTED', 'FAILED'], default: 'PENDING' },
  hash: { type: String, required: true }, // SHA256 of this tx
  prevHash: { type: String }, // chain integrity
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Make immutable - no updates allowed
transactionSchema.pre('findOneAndUpdate', function() { throw new Error('Ledger is immutable'); });

export default mongoose.model('Transaction', transactionSchema);