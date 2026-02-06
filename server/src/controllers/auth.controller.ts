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
const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const CSRF_COOKIE = 'XSRF-TOKEN';
const ACCESS_TTL_DEFAULT = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TTL_SHORT = process.env.JWT_REFRESH_EXPIRES_IN_SHORT || '7d';
const REFRESH_TTL_LONG = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const parseDurationMs = (value: string, fallbackMs: number) => {
    const match = /^(\d+)([smhd])$/i.exec(value.trim());
    if (!match) return fallbackMs;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isFinite(amount)) return fallbackMs;
    switch (unit) {
        case 's': return amount * 1000;
        case 'm': return amount * 60 * 1000;
        case 'h': return amount * 60 * 60 * 1000;
        case 'd': return amount * 24 * 60 * 60 * 1000;
        default: return fallbackMs;
    }
};

const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        path: '/'
    };
};

const getCsrfCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: false,
        secure: isProduction,
        sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        path: '/'
    };
};

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
        const rememberMe = Boolean(req.body.rememberMe);

        console.log('Login attempt for:', email);

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                branch: true,
                tenant: true
            }
        });

        if (!user) {
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

        if (!isPasswordValid) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS',
                remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - (user.failedLoginAttempts || 0) - 1)
            });
        }

        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing');
        if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET missing');

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, tenantId: user.tenantId },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TTL_DEFAULT as any }
        );

        const refreshTtl = rememberMe ? REFRESH_TTL_LONG : REFRESH_TTL_SHORT;
        const refreshToken = jwt.sign(
            { userId: user.id, rm: rememberMe, jti: crypto.randomBytes(16).toString('hex') },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: refreshTtl as any }
        );

        const refreshMs = parseDurationMs(refreshTtl, 30 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + refreshMs)
            }
        });

        await logAudit({
            action: 'LOGIN',
            resource: 'Auth',
            resourceId: user.id,
            details: { email },
            userId: user.id,
            tenantId: user.tenantId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        const accessCookie = getCookieOptions();
        const refreshCookie = getCookieOptions();
        const csrfToken = crypto.randomBytes(32).toString('hex');

        const accessMs = parseDurationMs(ACCESS_TTL_DEFAULT, 15 * 60 * 1000);
        res.cookie(ACCESS_COOKIE, accessToken, { ...accessCookie, maxAge: accessMs });
        res.cookie(REFRESH_COOKIE, refreshToken, { ...refreshCookie, maxAge: refreshMs });
        res.cookie(CSRF_COOKIE, csrfToken, { ...getCsrfCookieOptions(), maxAge: refreshMs });

        res.json({
            message: 'Login successful',
            token: accessToken,
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                branchId: user.branchId,
                tenantId: user.tenantId,
                passwordChangedAt: user.passwordChangedAt,
                tenant: {
                    name: (user.tenant as any).name,
                    logo: (user.tenant as any).logo
                }
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
        const { refreshToken, allDevices, userId } = req.body;
        const cookieRefresh = (req as any).cookies?.[REFRESH_COOKIE];
        const tokenToRevoke = refreshToken || cookieRefresh;

        const targetUserId = userId || req.user?.id;

        if (userId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        if (allDevices && targetUserId) {
            await prisma.refreshToken.deleteMany({
                where: { userId: targetUserId }
            });
        } else if (tokenToRevoke) {
            await prisma.refreshToken.deleteMany({
                where: { token: tokenToRevoke }
            });
        }

        if (req.user) {
            await logAudit({
                action: 'LOGOUT',
                resource: 'Auth',
                resourceId: req.user.id,
                userId: req.user.id,
                tenantId: req.user.tenantId,
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
        }

        const cookieOptions = getCookieOptions();
        res.clearCookie(ACCESS_COOKIE, cookieOptions);
        res.clearCookie(REFRESH_COOKIE, cookieOptions);
        res.clearCookie(CSRF_COOKIE, getCsrfCookieOptions());

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

export const issueCsrfToken = async (_req: Request, res: Response) => {
    const refreshMs = parseDurationMs(REFRESH_TTL_LONG, 30 * 24 * 60 * 60 * 1000);
    const csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, csrfToken, { ...getCsrfCookieOptions(), maxAge: refreshMs });
    return res.status(200).json({ ok: true });
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const cookieRefresh = (req as any).cookies?.[REFRESH_COOKIE];
        const bodyRefresh = req.body?.refreshToken;
        const refreshToken = cookieRefresh || bodyRefresh;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token missing' });
        }

        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!refreshSecret) {
            return res.status(500).json({ error: 'JWT_REFRESH_SECRET missing' });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string; rm?: boolean };
        } catch {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const stored = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        });

        if (!stored || stored.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Refresh token expired' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, tenantId: true, branchId: true, isActive: true }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not active' });
        }

        // Rotate refresh token
        const rememberMe = Boolean(decoded.rm);
        const refreshTtl = rememberMe ? REFRESH_TTL_LONG : REFRESH_TTL_SHORT;
        const newRefreshToken = jwt.sign(
            { userId: user.id, rm: rememberMe },
            refreshSecret,
            { expiresIn: refreshTtl as any }
        );

        const refreshMs = parseDurationMs(refreshTtl, 30 * 24 * 60 * 60 * 1000);
        await prisma.$transaction([
            prisma.refreshToken.deleteMany({ where: { token: refreshToken } }),
            prisma.refreshToken.create({
                data: {
                    token: newRefreshToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + refreshMs)
                }
            })
        ]);

        const accessSecret = process.env.JWT_SECRET;
        if (!accessSecret) {
            return res.status(500).json({ error: 'JWT_SECRET missing' });
        }

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, tenantId: user.tenantId },
            accessSecret,
            { expiresIn: ACCESS_TTL_DEFAULT as any }
        );

        const accessCookie = getCookieOptions();
        const refreshCookie = getCookieOptions();
        const csrfToken = crypto.randomBytes(32).toString('hex');

        const accessMs = parseDurationMs(ACCESS_TTL_DEFAULT, 15 * 60 * 1000);
        res.cookie(ACCESS_COOKIE, accessToken, { ...accessCookie, maxAge: accessMs });
        res.cookie(REFRESH_COOKIE, newRefreshToken, { ...refreshCookie, maxAge: refreshMs });
        res.cookie(CSRF_COOKIE, csrfToken, { ...getCsrfCookieOptions(), maxAge: refreshMs });

        res.json({ message: 'Token refreshed', token: accessToken, accessToken });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Refresh failed' });
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
            include: { branch: true, tenant: true }
        });

        res.json({
            message: 'Profil başarıyla güncellendi',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                passwordChangedAt: user.passwordChangedAt,
                branch: user.branch,
                tenant: {
                    name: (user.tenant as any)?.name,
                    logo: (user.tenant as any)?.logo
                }
            }
        });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        res.status(500).json({ error: 'Profil güncelleme başarısız oldu' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                branch: true,
                tenant: true
            }
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
                passwordChangedAt: user.passwordChangedAt,
                branch: user.branch ? {
                    id: user.branch.id,
                    name: user.branch.name
                } : null,
                tenant: {
                    name: (user.tenant as any).name,
                    logo: (user.tenant as any).logo
                }
            }
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'E-posta adresi gereklidir' });
        }

        const searchEmail = email.toString().trim().toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: searchEmail }
        });

        if (!user) {
            return res.json({
                message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // TODO: Add passwordResetToken model to schema
        // await prisma.passwordResetToken.upsert({
        //     where: { email: user.email },
        //     update: { token, expiresAt },
        //     create: { email: user.email, token, expiresAt }
        // });

        // await EmailService.sendResetPasswordEmail(user.email, token);

        return res.json({
            message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi (Geliştirme modunda devre dışı)'
        });
    } catch (error) {
        console.error('ForgotPassword error:', error);
        return res.status(500).json({ error: 'İşlem başarısız oldu' });
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

        // TODO: Add passwordResetToken model to schema
        /*
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

        // Delete used token
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id }
        });
        */

        return res.json({ message: 'Şifreniz başarıyla güncellendi (Geliştirme modunda devre dışı)' });
    } catch (error) {
        console.error('ResetPassword error:', error);
        res.status(500).json({ error: 'İşlem başarısız oldu' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { agencyName, adminName, email, password, isSingleBranch } = req.body;

        if (!agencyName || !adminName || !email || !password) {
            return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
        }

        // Check if user already exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: {
                tenant: true,
                branch: true
            }
        });

        if (user) {
            return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        }

        // Generate slug from agency name
        const slug = agencyName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        // Use transaction to ensure everything is created or nothing is
        console.log('Starting registration transaction for:', email);
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: agencyName,
                    slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`, // Add randomness to slug
                    plan: 'FREE',
                    // @ts-ignore
                    isSingleBranch: !!isSingleBranch
                }
            });
            console.log('Tenant created in transaction');

            // 2. Create Default Branch
            const branch = await tx.branch.create({
                data: {
                    name: 'Merkez Şube',
                    tenantId: tenant.id
                }
            });
            console.log('Branch created in transaction');

            // 3. Create Admin User
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await tx.user.create({
                data: {
                    name: adminName,
                    email: email.toLowerCase(),
                    password: hashedPassword,
                    role: 'ADMIN' as any,
                    tenantId: tenant.id,
                    branchId: branch.id
                }
            });
            console.log('User created in transaction');

            // Create default policy types for the new tenant
            const defaultPolicies = ['Trafik Sigortası', 'Kasko', 'Sağlık Sigortası', 'Konut Sigortası', 'DASK'];
            await tx.policyType.createMany({
                data: defaultPolicies.map(name => ({
                    name,
                    tenantId: tenant.id
                }))
            });
            console.log('Policies created in transaction');

            return { tenant, user };
        });
        console.log('Transaction completed successfully');

        await logAudit({
            action: 'CREATE',
            resource: 'Tenant',
            resourceId: result.tenant.id,
            details: { agencyName, adminEmail: email },
            userId: result.user.id,
            tenantId: result.tenant.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        console.log('Audit logged, sending success response');
        res.status(201).json({
            message: 'Kayıt başarılı! Hoş geldiniz.',
            tenant: result.tenant,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name
            }
        });

    } catch (error: any) {
        console.error('REGISTRATION ERROR:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Bu bilgilere sahip bir kayıt zaten mevcut (Slug veya E-posta çakışması)' });
        }
        res.status(500).json({ error: `Kayıt işlemi başarısız oldu: ${error.message}` });
    }
};
