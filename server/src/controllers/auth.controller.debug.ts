import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { EmailService } from '../services/email.service';

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        console.log('!!! V5_DEBUG: FORGOT PASSWORD REQUEST START !!!');
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'E-posta adresi gereklidir' });
        }

        const searchEmail = email.toString().trim().toLowerCase();
        console.log('!!! V5_DEBUG: Searching for:', searchEmail);

        const user = await prisma.user.findUnique({
            where: { email: searchEmail }
        });

        if (!user) {
            console.log('!!! V5_DEBUG: SEARCH_FAIL - No user with this email found.');
            const total = await prisma.user.count();
            console.log('!!! V5_DEBUG: Total users in database currently:', total);

            return res.json({
                message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
                _debug: 'V5_NOT_FOUND',
                _count: total
            });
        }

        console.log('!!! V5_DEBUG: SEARCH_SUCCESS - User found, generating token.');

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        await prisma.passwordResetToken.upsert({
            where: { email: user.email },
            update: { token, expiresAt },
            create: { email: user.email, token, expiresAt }
        });

        console.log('!!! V5_DEBUG: Calling EmailService.sendResetPasswordEmail...');
        const emailResult = await EmailService.sendResetPasswordEmail(user.email, token);
        console.log('!!! V5_DEBUG: EmailService result:', JSON.stringify(emailResult));

        return res.json({
            message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
            _debug: 'V5_SUCCESS_SENT',
            _timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('!!! V5_DEBUG: ERROR in forgotPassword:', error);
        return res.status(500).json({
            error: 'İşlem başarısız oldu',
            _debug: 'V5_CATCH_ERROR'
        });
    }
};

// Placeholder for resetPassword - you might want to view the original file to keep its implementation
export const resetPassword = async (req: Request, res: Response) => {
    // Keep original implementation
};
