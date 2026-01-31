import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/audit.util';
import { Role } from '../utils/constants';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const { branchId, role } = req.query;

        const where: { tenantId: string; branchId?: string; role?: Role } = {
            tenantId: currentUser.tenantId
        };
        if (branchId) where.branchId = String(branchId);
        if (role) where.role = role as Role;

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
    const currentUser = req.user!;

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
                tenantId: currentUser.tenantId,
                branchId: branchId || null,
                isActive: true,
                failedLoginAttempts: 0
            }
        });

        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                tenantId: currentUser.tenantId,
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
    const currentUser = req.user!;

    try {
        const data: {
            name?: string;
            role?: Role;
            branchId?: string | null;
            isActive?: boolean;
            password?: string;
            passwordChangedAt?: Date;
        } = {};
        if (name) data.name = name;
        if (role) data.role = role as Role;
        if (branchId !== undefined) data.branchId = branchId;
        if (isActive !== undefined) data.isActive = isActive;

        if (password) {
            data.password = await bcrypt.hash(password, 10);
            data.passwordChangedAt = new Date();
        }

        // Verify tenant membership
        const existing = await prisma.user.findFirst({
            where: { id, tenantId: currentUser.tenantId }
        });
        if (!existing) return res.status(404).json({ error: 'User not found' });

        const user = await prisma.user.update({
            where: { id },
            data
        });

        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                tenantId: currentUser.tenantId,
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
    const currentUser = req.user!;

    try {
        // Verify tenant membership
        const userToDelete = await prisma.user.findFirst({
            where: { id, tenantId: currentUser.tenantId },
            include: {
                _count: {
                    select: { sales: true }
                }
            }
        });

        if (!userToDelete) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Prevent deletion if user has sales
        if (userToDelete._count.sales > 0) {
            return res.status(400).json({
                error: 'Bu kullanıcının kaydettiği poliçeler/satışlar var. Veri bütünlüğü için silinemez. Bunun yerine kullanıcıyı pasif yapabilirsiniz.'
            });
        }

        await prisma.user.delete({ where: { id } });

        if (currentUser) {
            await logAudit({
                userId: currentUser.id,
                tenantId: currentUser.tenantId,
                action: 'DELETE',
                resource: 'User',
                resourceId: id
            });
        }

        res.json({ message: 'Kullanıcı başarıyla silindi' });
    } catch (error: any) {
        console.error('DeleteUser error:', error);
        res.status(500).json({ error: 'Kullanıcı silinemedi. Lütfen sistem yöneticisine danışın.' });
    }
};
