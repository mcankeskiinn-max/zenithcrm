import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateNotificationInput {
    tenantId: string;
    userId?: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    relatedId?: string;
    relatedType?: string;
    priority?: NotificationPriority;
    expiresAt?: Date;
}

export class NotificationService {
    /**
     * Create a new notification
     */
    static async create(input: CreateNotificationInput) {
        return await prisma.notification.create({
            data: {
                tenantId: input.tenantId,
                userId: input.userId,
                type: input.type,
                title: input.title,
                message: input.message,
                link: input.link,
                relatedId: input.relatedId,
                relatedType: input.relatedType,
                priority: input.priority || 'NORMAL',
                expiresAt: input.expiresAt
            }
        });
    }

    /**
     * Get unread count for user
     */
    static async getUnreadCount(tenantId: string, userId: string) {
        return await prisma.notification.count({
            where: {
                tenantId,
                OR: [
                    { userId },
                    { userId: null } // Broadcast notifications
                ],
                isRead: false
            }
        });
    }

    /**
     * Get notifications for user (paginated)
     */
    static async getForUser(
        tenantId: string,
        userId: string,
        page: number = 1,
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    tenantId,
                    OR: [
                        { userId },
                        { userId: null }
                    ]
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            prisma.notification.count({
                where: {
                    tenantId,
                    OR: [
                        { userId },
                        { userId: null }
                    ]
                }
            })
        ]);

        return {
            notifications,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(id: string, userId: string) {
        return await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    /**
     * Mark all as read for user
     */
    static async markAllAsRead(tenantId: string, userId: string) {
        return await prisma.notification.updateMany({
            where: {
                tenantId,
                OR: [
                    { userId },
                    { userId: null }
                ],
                isRead: false
            },
            data: { isRead: true }
        });
    }

    /**
     * Delete old notifications (cleanup job)
     */
    static async cleanup() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await prisma.notification.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lte: new Date() } },
                    {
                        isRead: true,
                        createdAt: { lte: thirtyDaysAgo }
                    }
                ]
            }
        });

        console.log(`🧹 Cleaned up ${result.count} old notifications`);
        return result;
    }
}
