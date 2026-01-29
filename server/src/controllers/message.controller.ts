import { Request, Response } from 'express';
import prisma from '../prisma';

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user!.id;

        if (!receiverId || !content) {
            return res.status(400).json({ error: 'ReceiverId and content are required' });
        }

        const sender = await prisma.user.findUnique({ where: { id: senderId } });
        if (!sender) return res.status(404).json({ error: 'Sender not found' });

        const message = await prisma.message.create({
            data: {
                content,
                senderId,
                receiverId,
                branchId: sender.branchId
            }
        });

        res.json(message);
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getConversations = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const userId = user.id;

        const users = await prisma.user.findMany({
            where: {
                id: { not: userId },
                isActive: true
            },
            select: { id: true, name: true, role: true, branch: { select: { name: true } } }
        });

        const conversations = await Promise.all(users.map(async (u) => {
            const lastMessage = await prisma.message.findFirst({
                where: {
                    OR: [
                        { senderId: userId, receiverId: u.id },
                        { senderId: u.id, receiverId: userId }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });

            const unreadCount = await prisma.message.count({
                where: {
                    senderId: u.id,
                    receiverId: userId,
                    isRead: false
                }
            });

            return {
                ...u,
                lastMessage: lastMessage?.content || '',
                lastMessageAt: lastMessage?.createdAt || null,
                unreadCount
            };
        }));

        res.json(conversations.sort((a, b) => {
            const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            if (dateA || dateB) return dateB - dateA;
            return a.name.localeCompare(b.name);
        }));

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { userId: otherUserId } = req.params;
        const userId = req.user!.id;

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });

        await prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: userId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json(messages);
    } catch (error) {
        console.error('Get messages history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAllSystemConversations = async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const where: { branchId?: string } = {};
        if (user.role === 'MANAGER' && user.branchId) {
            where.branchId = user.branchId;
        }

        const messages = await prisma.message.findMany({
            where,
            include: {
                sender: { select: { name: true, role: true } },
                receiver: { select: { name: true, role: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        res.json(messages);
    } catch (error) {
        console.error('Get all system conversations error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
