import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return res.status(400).json({ error: 'Password must be 8+ chars, upper, lower, number, symbol' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User exists' });

    const hashed = await bcrypt.hash(password, 12);
    const secret = speakeasy.generateSecret({ name: `ApexCore Bank (${email})`, length: 20 });
    await User.create({ email, password: hashed, mfaSecret: secret.base32, loginAttempts: 0, name });

    const qrImage = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ message: 'Registered', qrImage, manualCode: secret.base32 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, token } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.lockUntil && user.lockUntil > Date.now()) return res.status(423).json({ error: 'Account locked - 15min' });
  
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) user.lockUntil = Date.now() + 15*60*1000;
    await user.save();
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const verified = speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token, window: 1 });
  if (!verified) return res.status(401).json({ error: 'Invalid MFA token' });

  user.loginAttempts = 0; user.lockUntil = null; await user.save();
  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

  res.cookie('token', jwtToken, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 15*60*1000, path: '/' })
     .json({ user: { id: user._id, email: user.email } });
});

router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -mfaSecret');
    res.json({ user });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict', path: '/' }).json({ message: 'Logged out' });
});

export default router;