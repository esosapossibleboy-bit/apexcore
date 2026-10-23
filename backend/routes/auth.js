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
    
    // Password strength - anti-automation
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return res.status(400).json({ error: 'Password must be 8+ chars, upper, lower, number, symbol' });
    }
    
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'User exists' });

    // WEEK 6 FIX: Pass PLAIN password - model pre-save will hash it (no double hash)
    const secret = speakeasy.generateSecret({ name: `ApexCore Bank (${email})`, length: 20 });
    
    await User.create({ 
      email: email.toLowerCase(), 
      password: password, // Plain - let model hash
      mfaSecret: secret.base32, 
      loginAttempts: 0, 
      name,
      balance: 13284.50 // Keep your demo balance
    });

    const qrImage = await QRCode.toDataURL(secret.otpauth_url);
    
    // AUDIT PASS: Only returns QR, not user object with hash
    res.json({ message: 'Registered', qrImage, manualCode: secret.base32 });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' }); // Never leak err.message
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, token } = req.body;
    
    // WEEK 6 FIX: Must select +password +mfaSecret because select:false in model
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +mfaSecret +loginAttempts +lockUntil');
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({ error: 'Account locked - 15min - anti-automation active' });
    }
    
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) user.lockUntil = new Date(Date.now() + 15*60*1000);
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const verified = speakeasy.totp.verify({ 
      secret: user.mfaSecret, 
      encoding: 'base32', 
      token, 
      window: 1 
    });
    if (!verified) return res.status(401).json({ error: 'Invalid MFA token' });

    user.loginAttempts = 0; 
    user.lockUntil = null; 
    await user.save();
    
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // WEEK 6: Production cookie - secure true in production, false in dev
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', jwtToken, { 
      httpOnly: true, 
      secure: isProduction, // true on Render, false on localhost
      sameSite: isProduction ? 'none' : 'strict', // none for cross-site Vercel->Render
      maxAge: 15*60*1000, 
      path: '/' 
    })
    // AUDIT PASS: Only safe fields - no password, no mfaSecret, no loginAttempts
    .json({ 
      user: { id: user._id, email: user.email, balance: user.balance, name: user.name } 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // AUDIT PASS: select excludes password + mfaSecret
    const user = await User.findById(decoded.id).select('-password -mfaSecret');
    
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    res.json({ user });
  } catch { 
    res.status(401).json({ error: 'Invalid token' }); 
  }
});

router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', { 
    httpOnly: true, 
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict', 
    path: '/' 
  }).json({ message: 'Logged out' });
});

export default router;