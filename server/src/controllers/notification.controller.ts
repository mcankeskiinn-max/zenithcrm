import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await NotificationService.getForUser(
            currentUser.tenantId,
            currentUser.id,
            page,
            limit
        );

        res.json(result);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;

        const count = await NotificationService.getUnreadCount(
            currentUser.tenantId,
            currentUser.id
        );

        res.json({ count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentUser = req.user!;

        await NotificationService.markAsRead(id, currentUser.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const currentUser = req.user!;

        await NotificationService.markAllAsRead(
            currentUser.tenantId,
            currentUser.id
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};
