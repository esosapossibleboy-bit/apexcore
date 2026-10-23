import mongoose from 'mongoose';

const txSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    immutable: true // cannot change owner
  },
  type: { 
    type: String, 
    enum: ['credit', 'debit'], 
    required: true,
    immutable: true 
  },
  amount: { 
    type: Number, 
    required: true,
    immutable: true, // Rule 1: never overwrite
    validate: {
      validator: function(v) {
        // Rule 3: Isolate mutative requests - block negative metrics
        return Number.isFinite(v) && v > 0 && v <= 1000000;
      },
      message: 'Amount must be positive finite number (0 < amount <= 1M)'
    }
  },
  description: { type: String, default: '', immutable: true },
  toEmail: { type: String, immutable: true },
  fromEmail: { type: String, immutable: true }
}, { 
  timestamps: { createdAt: true, updatedAt: false } // only createdAt, no updates
});

// Rule 1: Prevent ANY update or delete - immutable history
txSchema.pre('findOneAndUpdate', function() {
  throw new Error('Immutable log: Transaction cannot be modified');
});
txSchema.pre('updateOne', function() {
  throw new Error('Immutable log: Transaction cannot be modified');
});
txSchema.pre('deleteOne', function() {
  throw new Error('Immutable log: Transaction cannot be deleted');
});

// Rule 1: Compute valuation by accumulating logs
txSchema.statics.getBalance = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { 
      _id: null, 
      balance: { 
        $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }] }
      } 
    }}
  ]);
  return result[0]?.balance || 0; // server-side calculation per Rule 2
};

export default mongoose.model('Transaction', txSchema);