import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User exists' });

    const hashed = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: `ApexCore:${email}` });

    const user = await User.create({
      email,
      password: hashed,
      firstName,
      lastName,
      twoFASecret: secret.base32,
      is2FAVerified: false
    });

    const otpauth_url = secret.otpauth_url;
    const qr = await qrcode.toDataURL(otpauth_url);

    res.status(201).json({ 
      message: 'Registered - verify 2FA',
      secret: secret.base32,
      otpauth_url,
      qrCode: qr,
      userId: user._id
    });
  } catch (err) {
    next(err);
  }
};

export const verify2FA = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token
    });

    if (!verified) return res.status(400).json({ error: 'Invalid 2FA token' });

    user.is2FAVerified = true;
    await user.save();

    res.json({ message: '2FA verified' });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, token } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token
    });
    if (!verified) return res.status(401).json({ error: 'Invalid 2FA token' });

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: 'Strict',
      maxAge: 15*60*1000
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 7*24*60*60*1000
    });

    res.json({ message: 'Login successful', user: { email: user.email } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Strict',
      maxAge: 15*60*1000
    });

    res.json({ message: 'Token refreshed' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -twoFASecret');
    res.json({ user, balance: 12450.00 });
  } catch (err) {
    next(err);
  }
};