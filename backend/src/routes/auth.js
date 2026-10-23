import express from 'express';
import { register, verify2FA, login, logout, refresh, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-2fa', verify2FA);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe); // protected - for Dashboard balance page

export default router;