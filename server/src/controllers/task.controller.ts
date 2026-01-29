import { Request, Response } from 'express';
import prisma from '../prisma';
import { Role } from '../utils/constants';

// List tasks
export const getTasks = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const isAdmin = user.role === Role.ADMIN;
        const isManager = user.role === Role.MANAGER;

        const where: { assignedTo?: { branchId?: string }; assignedToId?: string } = {};

        // Branch Manager restriction: only their branch
        if (isManager && user.branchId) {
            where.assignedTo = { branchId: user.branchId };
        }
        // Employee restriction: only their own tasks
        else if (!isAdmin) {
            where.assignedToId = user.id;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: { select: { id: true, name: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Create task
export const createTask = async (req: Request, res: Response) => {
    const { title, description, dueDate, assignedToId } = req.body;
    const currentUser = req.user!;

    try {
        // Check if assignedTo user belongs to the same branch if current user is Manager
        if (currentUser.role === Role.MANAGER) {
            const assignedUser = await prisma.user.findUnique({ where: { id: assignedToId || currentUser.id } });
            if (assignedUser && assignedUser.branchId !== currentUser.branchId) {
                return res.status(403).json({ error: 'Farklı bir şubedeki personele görev atayamazsınız.' });
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                assignedToId: assignedToId || currentUser.id
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

// Update task
export const updateTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, dueDate, isCompleted, assignedToId } = req.body;
    const currentUser = req.user!;

    try {
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { assignedTo: true }
        });
        if (!existingTask) return res.status(404).json({ error: 'Task not found' });

        // Permission Check
        if (currentUser.role !== Role.ADMIN) {
            // Manager can only update tasks in their branch
            if (currentUser.role === Role.MANAGER) {
                if (existingTask.assignedTo.branchId !== currentUser.branchId) {
                    return res.status(403).json({ error: 'Farklı şubedeki bir görevi düzenleyemezsiniz.' });
                }
                // If reassigning, new user must be in branch
                if (assignedToId) {
                    const newUser = await prisma.user.findUnique({ where: { id: assignedToId } });
                    if (newUser?.branchId !== currentUser.branchId) {
                        return res.status(403).json({ error: 'Farklı şubeye atama yapılamaz.' });
                    }
                }
            }
            // Employee can only update THEIR own tasks
            else {
                if (existingTask.assignedToId !== currentUser.id) {
                    return res.status(403).json({ error: 'Sadece kendi görevlerinizi düzenleyebilirsiniz.' });
                }
                if (assignedToId && assignedToId !== currentUser.id) {
                    return res.status(403).json({ error: 'Görevi başkasına atayamazsınız.' });
                }
            }
        }

        const updateData: {
            title?: string;
            description?: string;
            dueDate?: Date;
            isCompleted?: boolean;
            assignedToId?: string;
        } = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
        if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

        const task = await prisma.task.update({
            where: { id },
            data: updateData
        });

        res.json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Delete task
export const deleteTask = async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user!;

    try {
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { assignedTo: true }
        });
        if (!existingTask) return res.status(404).json({ error: 'Task not found' });

        if (currentUser.role !== Role.ADMIN) {
            if (currentUser.role === Role.MANAGER) {
                if (existingTask.assignedTo.branchId !== currentUser.branchId) {
                    return res.status(403).json({ error: 'Farklı şubedeki bir görevi silemezsiniz.' });
                }
            } else {
                if (existingTask.assignedToId !== currentUser.id) {
                    return res.status(403).json({ error: 'Sadece kendi görevlerinizi silebilirsiniz.' });
                }
            }
        }

        await prisma.task.delete({
            where: { id }
        });
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
