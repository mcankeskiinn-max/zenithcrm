import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all branches
export const getBranches = async (req: Request, res: Response) => {
    try {
        const branches = await prisma.branch.findMany({
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
        const existingBranch = await prisma.branch.findUnique({ where: { name } });
        if (existingBranch) {
            return res.status(400).json({ error: 'Branch name already exists' });
        }

        // Store as object for Prisma Json field
        const settings = { commissionRate: Number(commissionRate) };

        const branch = await prisma.branch.create({
            data: {
                name,
                settings
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
        const settings = commissionRate ? { commissionRate: Number(commissionRate) } : undefined;

        const branch = await prisma.branch.update({
            where: { id },
            data: {
                name,
                settings
            }
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
        await prisma.branch.delete({ where: { id } });
        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete branch' });
    }
};
