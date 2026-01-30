import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { Role } from '../utils/constants';
import { logAudit } from '../utils/audit.util';
import { EmailService } from '../services/email.service';
import crypto from 'crypto';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 dakika

export const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

export const login = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const email = req.body.email?.toString().trim().toLowerCase();
        const password = req.body.password?.toString().trim();

        const charCodes = password ? [...password].map(c => c.charCodeAt(0)).join(',') : 'empty';
        console.log('Login attempt for:', email, '(length:', password?.length, ') CharCodes:', charCodes);

        const user = await prisma.user.findUnique({
            where: { email },
            include: { branch: true }
        });

        if (!user) {
            console.log('User NOT found in DB:', email);
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        if (!user.isActive) {
            console.log('User is inactive:', email);
            return res.status(403).json({
                error: 'Account deactivated',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        console.log('Generating tokens...');
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
        if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET missing');

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
        );

        console.log('Saving refresh token...');
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        console.log('Logging audit...');
        await logAudit({
            action: 'LOGIN',
            resource: 'Auth',
            resourceId: user.id,
            details: { email },
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        console.log('Login successful for:', email);
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                branchId: user.branchId
            }
        });

    } catch (error) {
        console.error('CRITICAL LOGIN ERROR:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'SERVER_ERROR'
        });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
        }

        if (req.user) {
            await logAudit({
                action: 'LOGOUT',
                resource: 'Auth',
                resourceId: req.user.id,
                userId: req.user.id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        }

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user!.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gereklidir' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Yeni şifre en az 6 karakter olmalıdır'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(401).json({
                error: 'Mevcut şifre hatalı'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date()
            }
        });

        await logAudit({
            action: 'UPDATE',
            resource: 'User',
            resourceId: userId,
            details: { field: 'password' },
            userId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({ message: 'Şifre başarıyla güncellendi' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Şifre değiştirme işlemi başarısız oldu' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body;
        const userId = req.user!.id;

        const data: { name?: string; email?: string } = {};
        if (name) data.name = name;
        if (email) {
            const existing = await prisma.user.findFirst({
                where: { email, NOT: { id: userId } }
            });
            if (existing) {
                return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
            }
            data.email = email;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data,
            include: { branch: true }
        });

        res.json({
            message: 'Profil başarıyla güncellendi',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                branch: user.branch
            }
        });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({ error: 'Profil güncelleme başarısız oldu' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: { branch: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                branchId: user.branchId,
                branch: user.branch ? {
                    id: user.branch.id,
                    name: user.branch.name
                } : null
            }
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        console.log('!!! FORGOT PASSWORD CLICKED !!!');
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'E-posta adresi gereklidir' });
        }

        const searchEmail = email.toString().trim().toLowerCase();
        console.log('Forgot password request for email:', searchEmail);

        const user = await prisma.user.findUnique({
            where: { email: searchEmail }
        });

        if (!user) {
            console.log('User NOT found for forgot password:', searchEmail);
            // Return success message to avoid email enumeration security risk
            return res.json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' });
        }

        console.log('User found! Proceeding to generate token for:', user.email);

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await prisma.passwordResetToken.upsert({
            where: { email: user.email },
            update: { token, expiresAt },
            create: { email: user.email, token, expiresAt }
        });

        const emailResult = await EmailService.sendResetPasswordEmail(user.email, token);
        console.log('>>> [RESEND_SUCCESS] Result:', JSON.stringify(emailResult));

        res.json({
            message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
            debug_id: 'IDENTIFIER_CODE_V2'
        });
    } catch (error) {
        console.error('ForgotPassword error:', error);
        res.status(500).json({ error: 'İşlem başarısız oldu' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token ve yeni şifre gereklidir' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır' });
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş bağlantı' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email: resetToken.email },
            data: {
                password: hashedPassword,
                passwordChangedAt: new Date()
            }
        });

        await prisma.passwordResetToken.delete({
            where: { token }
        });

        res.json({ message: 'Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('ResetPassword error:', error);
        res.status(500).json({ error: 'İşlem başarısız oldu' });
    }
};

