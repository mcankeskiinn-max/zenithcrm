import { SupportStatus } from '@prisma/client';
import prisma from '../prisma';

export class SupportService {
    static async createMessage(userId: string, tenantId: string, message: string, metadata?: any) {
        return await prisma.supportMessage.create({
            data: {
                userId,
                tenantId,
                message,
                status: SupportStatus.PENDING,
                metadata: metadata || {},
            },
        });
    }

    static async getMessages(userId: string, tenantId: string) {
        return await prisma.supportMessage.findMany({
            where: { userId, tenantId },
            orderBy: { createdAt: 'asc' },
        });
    }

    static async getMessageById(id: string, tenantId?: string, userId?: string) {
        return await prisma.supportMessage.findUnique({
            where: { id, ...(tenantId ? { tenantId } : {}), ...(userId ? { userId } : {}) },
            include: { user: true },
        });
    }

    static async updateMessageResponse(
        id: string,
        response: string,
        status: SupportStatus = SupportStatus.RESOLVED,
        tenantId?: string,
        userId?: string
    ) {
        if (userId || tenantId) {
            const result = await prisma.supportMessage.updateMany({
                where: { id, ...(tenantId ? { tenantId } : {}), ...(userId ? { userId } : {}) },
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

    static async updateStatus(id: string, status: SupportStatus, tenantId?: string, userId?: string) {
        if (userId || tenantId) {
            const result = await prisma.supportMessage.updateMany({
                where: { id, ...(tenantId ? { tenantId } : {}), ...(userId ? { userId } : {}) },
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
