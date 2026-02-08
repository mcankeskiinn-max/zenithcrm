import { SupportStatus } from '@prisma/client';
import prisma from '../prisma';

export class SupportService {
    static async createMessage(userId: string, message: string, metadata?: any) {
        return await prisma.supportMessage.create({
            data: {
                userId,
                message,
                status: SupportStatus.PENDING,
                metadata: metadata || {},
            },
        });
    }

    static async getMessages(userId: string) {
        return await prisma.supportMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    static async getMessageById(id: string, userId?: string) {
        return await prisma.supportMessage.findUnique({
            where: { id, ...(userId ? { userId } : {}) },
            include: { user: true },
        });
    }

    static async updateMessageResponse(
        id: string,
        response: string,
        status: SupportStatus = SupportStatus.RESOLVED,
        userId?: string
    ) {
        if (userId) {
            const result = await prisma.supportMessage.updateMany({
                where: { id, userId },
                data: {
                    response,
                    status,
                    aiProcessed: true,
                },
            });
            if (result.count === 0) {
                throw new Error('Support message not found');
            }
            return result;
        }

        return await prisma.supportMessage.update({
            where: { id },
            data: {
                response,
                status,
                aiProcessed: true,
            },
        });
    }

    static async updateStatus(id: string, status: SupportStatus, userId?: string) {
        if (userId) {
            const result = await prisma.supportMessage.updateMany({
                where: { id, userId },
                data: { status },
            });
            if (result.count === 0) {
                throw new Error('Support message not found');
            }
            return result;
        }

        return await prisma.supportMessage.update({
            where: { id },
            data: { status },
        });
    }
}
