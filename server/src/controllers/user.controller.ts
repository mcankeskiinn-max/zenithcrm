import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/audit.util';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { branchId, role } = req.query;

        const where: any = {};
        if (branchId) where.branchId = String(branchId);
        if (role) where.role = role as any;

        const users = await prisma.user.findMany({
            where,
            include: { branch: true },
            orderBy: { createdAt: 'desc' }
        });

        const safeUsers = users.map(user => {
            const { password, ...rest } = user;
            return rest;
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('GetUsers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, branchId } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: (role || 'EMPLOYEE') as any,
                branchId: branchId || null,
                isActive: true,
                failedLoginAttempts: 0
            }
        });

        const currentUser = req.user;
        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                action: 'CREATE',
                resource: 'User',
                resourceId: user.id,
                details: { email: user.email, name: user.name, role: user.role }
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('CreateUser error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, role, branchId, password, isActive } = req.body;

    try {
        const data: any = {};
        if (name) data.name = name;
        if (role) data.role = role as any;
        if (branchId !== undefined) data.branchId = branchId;
        if (isActive !== undefined) data.isActive = isActive;

        if (password) {
            data.password = await bcrypt.hash(password, 10);
            data.passwordChangedAt = new Date();
        }

        const user = await prisma.user.update({
            where: { id },
            data
        });

        const currentUser = req.user;
        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                action: 'UPDATE',
                resource: 'User',
                resourceId: id,
                details: { updates: Object.keys(data) }
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('UpdateUser error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({ where: { id } });

        const currentUser = req.user;
        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                action: 'DELETE',
                resource: 'User',
                resourceId: id
            });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('DeleteUser error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
