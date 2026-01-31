import { Request, Response } from 'express';
import prisma from '../prisma';
import { logAudit } from '../utils/audit.util';

export const getPreferences = async (req: Request, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true, logo: true }
        });

        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        res.json(tenant);
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updatePreferences = async (req: Request, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { name, logo } = req.body;

        if (req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can update preferences' });
        }

        const tenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { name, logo }
        });

        await logAudit({
            action: 'UPDATE',
            resource: 'Tenant',
            resourceId: tenantId,
            details: { name, logo },
            userId: req.user!.id,
            tenantId: tenantId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({ message: 'Tercihler güncellendi', tenant });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
