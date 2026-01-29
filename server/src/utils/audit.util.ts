import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const logAudit = async (data: {
    userId?: string;
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'UNAUTHORIZED';
    resource: string;
    resourceId?: string;
    details?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details || Prisma.JsonNull,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent
            }
        });
    } catch (error) {
        console.error('Audit log failed:', error);
    }
};
