import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all branches
export const getBranches = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const branches = await prisma.branch.findMany({
            where: { tenantId: currentUser.tenantId },
            include: {
                _count: {
                    select: { users: true, sales: true }
                }
            }
        });

        // Prisma PostgreSQL handles Json fields as objects automatically
        const formattedBranches = branches.map(branch => ({
            ...branch,
            settings: (branch.settings as { commissionRate?: number }) || {}
        }));

        res.json(formattedBranches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create a new branch
export const createBranch = async (req: Request, res: Response) => {
    const { name, commissionRate } = req.body;

    try {
        const currentUser = req.user!;
        const existingBranch = await prisma.branch.findFirst({
            where: { name, tenantId: currentUser.tenantId }
        });
        if (existingBranch) {
            return res.status(400).json({ error: 'Branch name already exists' });
        }

        // Check if tenant is single-branch
        const tenant = await prisma.tenant.findUnique({
            where: { id: currentUser.tenantId }
        });

        if (tenant?.isSingleBranch) {
            return res.status(403).json({ error: 'Tek şubeli planda yeni şube eklenemez.' });
        }

        // Store as object for Prisma Json field
        const settings = { commissionRate: Number(commissionRate) };

        const branch = await prisma.branch.create({
            data: {
                name,
                settings,
                tenantId: currentUser.tenantId
            }
        });

        res.status(201).json(branch);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update branch
export const updateBranch = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, commissionRate } = req.body;

    try {
        const currentUser = req.user!;
        const existing = await prisma.branch.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Branch not found' });

        const settings = commissionRate ? { commissionRate: Number(commissionRate) } : undefined;

        const result = await prisma.branch.updateMany({
            where: { id, tenantId: currentUser.tenantId },
            data: {
                name,
                settings
            }
        });

        if (result.count === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }

        const branch = await prisma.branch.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });

        res.json(branch);
    } catch (error) {
        console.error('Update branch error:', error);
        res.status(500).json({ error: 'Failed to update branch' });
    }
};

// Delete branch
export const deleteBranch = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const currentUser = req.user!;
        const existing = await prisma.branch.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'Branch not found' });

        const result = await prisma.branch.deleteMany({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Branch not found' });
        }
        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete branch' });
    }
};
