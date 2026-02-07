import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

const UNREAD_CACHE_TTL_MS = 60 * 1000;
const unreadCache = new Map<string, { ts: number; count: number }>();

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
        const buildSha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'unknown';
        res.set('X-App-Build', buildSha);

        const cacheKey = `${currentUser.tenantId}:${currentUser.id}`;
        const cached = unreadCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < UNREAD_CACHE_TTL_MS) {
            res.set('Cache-Control', 'private, max-age=60');
            return res.json({ count: cached.count, cached: true });
        }

        const count = await NotificationService.getUnreadCount(
            currentUser.tenantId,
            currentUser.id
        );

        unreadCache.set(cacheKey, { ts: Date.now(), count });
        res.set('Cache-Control', 'private, max-age=60');

        res.json({ count, cached: false });
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
