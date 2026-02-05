import { Request, Response } from 'express';
import prisma from '../prisma';

export const logoutAllSessions = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const { userId } = req.body;

        if (userId) {
            await prisma.refreshToken.deleteMany({ where: { userId } });
            return res.json({ message: 'User sessions revoked' });
        }

        await prisma.refreshToken.deleteMany({ where: {} });
        return res.json({ message: 'All sessions revoked' });
    } catch (error) {
        console.error('LogoutAllSessions error:', error);
        return res.status(500).json({ error: 'Logout all sessions failed' });
    }
};

export const listSessions = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const sessions = await prisma.refreshToken.findMany({
            select: {
                id: true,
                token: true,
                createdAt: true,
                expiresAt: true,
                userId: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const safeSessions = sessions.map((s) => ({
            id: s.id,
            userId: s.userId,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            tokenSuffix: s.token.slice(0, 8)
        }));

        res.json({ sessions: safeSessions });
    } catch (error) {
        console.error('ListSessions error:', error);
        res.status(500).json({ error: 'List sessions failed' });
    }
};

