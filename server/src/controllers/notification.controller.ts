import { Request, Response } from 'express';
import prisma from '../prisma';
import { addDays } from 'date-fns';

interface NotificationUI {
    id: string;
    type: string;
    title: string;
    message: string;
    date: Date;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    link?: string;
}

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const userRole = req.user!.role;
        const branchId = req.user!.branchId;

        const notifications: NotificationUI[] = [];
        const now = new Date();
        const next30Days = addDays(now, 30);

        // 1. Persistent Notifications from DB
        const dbNotifications = await prisma.notification.findMany({
            where: {
                userId,
                isRead: false
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        dbNotifications.forEach(n => {
            notifications.push({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.content,
                date: n.createdAt,
                priority: 'MEDIUM',
                link: n.type === 'MESSAGE' ? '/messaging' : undefined
            });
        });

        // 2. Expiring Policies (Sales)
        const salesWhere: {
            endDate: { gt: Date; lte: Date };
            status: 'ACTIVE';
            employeeId?: string;
            branchId?: string;
        } = {
            endDate: {
                gt: now,
                lte: next30Days
            },
            status: 'ACTIVE'
        };

        if (userRole === 'EMPLOYEE') {
            salesWhere.employeeId = userId;
        } else if (userRole === 'MANAGER') {
            salesWhere.branchId = branchId;
        }

        const expiringPolicies = await prisma.sale.findMany({
            where: salesWhere,
            include: { policyType: { select: { name: true } } },
            take: 5
        });

        expiringPolicies.forEach(sale => {
            notifications.push({
                id: `sale-${sale.id}`,
                type: 'POLICY_EXPIRING',
                title: 'Poliçe Bitişi Yaklaşıyor',
                message: `${sale.customerName} - ${sale.policyType.name} poliçesi yakında sona erecek.`,
                date: sale.endDate || now,
                priority: 'HIGH',
                link: '/sales'
            });
        });

        // 3. Upcoming Tasks (Meetings)
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: userId,
                isCompleted: false,
                dueDate: {
                    lte: addDays(now, 2)
                }
            },
            take: 5
        });

        tasks.forEach(task => {
            notifications.push({
                id: `task-${task.id}`,
                type: 'TASK_DUE',
                title: 'Görevin Vakti Yaklaşıyor',
                message: task.title,
                date: task.dueDate,
                priority: task.priority === 'URGENT' || task.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
                link: '/tasks'
            });
        });

        // 4. Unread Messages (Fallback if not in persistent notifications)
        const unreadMessages = await prisma.message.findMany({
            where: {
                receiverId: userId,
                isRead: false
            },
            include: { sender: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            distinct: ['senderId'],
            take: 5
        });

        unreadMessages.forEach((msg) => {
            if (!notifications.some(n => n.type === 'MESSAGE' && n.id.includes(msg.id))) {
                notifications.push({
                    id: `msg-${msg.id}`,
                    type: 'MESSAGE',
                    title: 'Yeni Mesaj',
                    message: `${msg.sender.name}: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}`,
                    date: msg.createdAt,
                    priority: 'MEDIUM',
                    link: '/messaging'
                });
            }
        });

        res.json(notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (error) {
        console.error('Failed to fetch notifications', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        await prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
