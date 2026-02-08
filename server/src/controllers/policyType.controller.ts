import { Request, Response } from 'express';
import prisma from '../prisma';
import { logAudit } from '../utils/audit.util';

export const getPolicyTypes = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const types = await prisma.policyType.findMany({
            where: { tenantId: currentUser.tenantId },
            orderBy: { name: 'asc' }
        });
        res.json(types);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({ error: message });
    }
};

export const createPolicyType = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
        const currentUser = req.user!;
        console.log(`Creating policy type: "${name}" for tenant: ${currentUser.tenantId}`);

        const type = await prisma.policyType.create({
            data: {
                name,
                tenantId: currentUser.tenantId
            }
        });

        if (currentUser) {
            try {
                await logAudit({
                    userId: currentUser.id,
                    tenantId: currentUser.tenantId,
                    action: 'CREATE',
                    resource: 'PolicyType',
                    resourceId: type.id,
                    details: { name }
                });
            } catch (auditError) {
                console.error('Audit log failed during policy type creation:', auditError);
                // Don't fail the request if audit logging fails
            }
        }

        res.status(201).json(type);
    } catch (error: unknown) {
        console.error('Policy Type Creation Error:', error);
        if (error instanceof Error) {
            // Check for Prisma unique constraint violation
            if ((error as any).code === 'P2002') {
                return res.status(400).json({ error: 'Bu poliçe tipi zaten mevcut.' });
            }
            res.status(500).json({ error: `Sunucu hatası: ${error.message}` });
        } else {
            res.status(500).json({ error: 'Beklenmeyen bir sunucu hatası oluştu.' });
        }
    }
};

export const deletePolicyType = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const currentUser = req.user!;
        const existing = await prisma.policyType.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Policy type not found' });

        // Check if there are sales using this policy type
        const salesCount = await prisma.sale.count({
            where: { policyTypeId: id, tenantId: currentUser.tenantId }
        });
        if (salesCount > 0) {
            return res.status(400).json({ error: 'Bu poliçe tipine bağlı satışlar olduğu için silinemez.' });
        }

        const result = await prisma.policyType.deleteMany({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Policy type not found' });
        }
        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                tenantId: currentUser.tenantId,
                action: 'DELETE',
                resource: 'PolicyType',
                resourceId: id
            });
        }
        res.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: message });
    }
};
export const updatePolicyType = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const currentUser = req.user!;
        const existing = await prisma.policyType.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Policy type not found' });

        const result = await prisma.policyType.updateMany({
            where: { id, tenantId: currentUser.tenantId },
            data: { name }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Policy type not found' });
        }

        const type = await prisma.policyType.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                tenantId: currentUser.tenantId,
                action: 'UPDATE',
                resource: 'PolicyType',
                resourceId: id,
                details: { name }
            });
        }
        res.json(type);
    } catch (error: unknown) {
        res.status(400).json({ error: 'Güncelleme başarısız veya geçersiz branş adı.' });
    }
};
