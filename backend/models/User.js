import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  mfaSecret: { type: String, select: false },
  name: { type: String },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
  // REMOVED: balance - now computed from immutable Transaction logs per Rule 1
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.mfaSecret;
      delete ret.__v;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);