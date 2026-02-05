import { PrismaClient, SupportStatus } from '@prisma/client';

const prisma = new PrismaClient();

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

    static async getMessageById(id: string) {
        return await prisma.supportMessage.findUnique({
            where: { id },
            include: { user: true },
        });
    }

    static async updateMessageResponse(id: string, response: string, status: SupportStatus = SupportStatus.RESOLVED) {
        return await prisma.supportMessage.update({
            where: { id },
            data: {
                response,
                status,
                aiProcessed: true,
            },
        });
    }

    static async updateStatus(id: string, status: SupportStatus) {
        return await prisma.supportMessage.update({
            where: { id },
            data: { status },
        });
    }
}
