import { Request, Response } from 'express';
import prisma from '../prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { page = 1, limit = 50, action, resource, userId } = req.query;

        // Only ADMIN can see all logs. MANAGER can see their branch's logs (if we filter by branch)
        // For now, let's stick to ADMIN/MANAGER seeing logs.
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: { action?: string; resource?: string; userId?: string; user?: { branchId: string } } = {};
        if (action) where.action = action as string;
        if (resource) where.resource = resource as string;
        if (userId) where.userId = userId as string;

        // If Manager, only show logs for users in their branch
        if (user.role === 'MANAGER' && user.branchId) {
            where.user = {
                branchId: user.branchId
            };
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, role: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / take)
            }
        });

    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
