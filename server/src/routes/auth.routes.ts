import { Router } from 'express';
import { login, register, getMe, changePassword, updateProfile, forgotPassword, resetPassword, logout, refresh, issueCsrfToken } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/csrf', issueCsrfToken);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

export default router;
