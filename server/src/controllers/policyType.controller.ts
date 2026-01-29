import { Request, Response } from 'express';
import prisma from '../prisma';
import { logAudit } from '../utils/audit.util';

export const getPolicyTypes = async (req: Request, res: Response) => {
    try {
        const types = await prisma.policyType.findMany({
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
        const type = await prisma.policyType.create({
            data: { name }
        });
        const user = req.user;
        if (user) {
            await logAudit({
                userId: user.id,
                action: 'CREATE',
                resource: 'PolicyType',
                resourceId: type.id,
                details: { name }
            });
        }
        res.status(201).json(type);
    } catch (error: unknown) {
        res.status(400).json({ error: 'Bu poliçe tipi zaten mevcut veya geçersiz.' });
    }
};

export const deletePolicyType = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Check if there are sales using this policy type
        const salesCount = await prisma.sale.count({ where: { policyTypeId: id } });
        if (salesCount > 0) {
            return res.status(400).json({ error: 'Bu poliçe tipine bağlı satışlar olduğu için silinemez.' });
        }

        await prisma.policyType.delete({ where: { id } });
        const user = req.user;
        if (user) {
            await logAudit({
                userId: user.id,
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
        const type = await prisma.policyType.update({
            where: { id },
            data: { name }
        });
        const user = req.user;
        if (user) {
            await logAudit({
                userId: user.id,
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
