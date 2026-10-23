import mongoose from 'mongoose';

const txSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  toEmail: String,
  fromEmail: String
}, { timestamps: true });

export default mongoose.model('Transaction', txSchema);