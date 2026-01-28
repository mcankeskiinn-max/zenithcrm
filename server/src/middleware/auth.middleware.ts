import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { Role } from '../utils/constants';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: Role; // Use Role enum type
                branchId?: string;
            };
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.substring(7);

        let decoded: any;
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error('CRITICAL: JWT_SECRET is missing in middleware!');
                return res.status(500).json({ error: 'Internal server error' });
            }


            decoded = jwt.verify(token, secret);
        } catch (error: any) {
            console.error('JWT Verify Error:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                branchId: true,
                isActive: true,
                lockedUntil: true
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                error: 'Account is deactivated',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            return res.status(403).json({
                error: 'Account is locked',
                code: 'ACCOUNT_LOCKED'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role as Role,
            branchId: user.branchId || undefined
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

export const authorize = (...allowedRoles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NO_USER'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            console.warn(`Access denied for role: ${req.user.role}. Allowed: ${allowedRoles}`);
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'FORBIDDEN'
            });
        }

        next();
    };
};
