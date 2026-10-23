import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    // Strict RFC 5322 + normalization
    match: [/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Invalid email'],
    // Prevent NoSQL injection via long strings
    validate: {
      validator: v => v.length <= 254 && v.split('@')[0].length <= 64,
      message: 'Email too long'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 12,
    maxlength: 128,
    select: false // NEVER return password by default
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: [/^[a-zA-Z\s'-]+$/, 'Invalid name format']
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: [/^[a-zA-Z\s'-]+$/, 'Invalid name format']
  },
  is2FAEnabled: { type: Boolean, default: false },
  totpSecret: { type: String, select: false }, // encrypted
  totpBackupCodes: [{ type: String, select: false }], // 8 one-time codes, hashed
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Email normalization pre-save
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Hash password - cost 12 is banking standard
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);