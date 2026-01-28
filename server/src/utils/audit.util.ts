import prisma from '../prisma';

export const logAudit = async (data: {
    userId?: string;
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'UNAUTHORIZED';
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}) => {
    try {
        await prisma.auditLog.create({
            data: {
                ...data,
                details: data.details ? data.details : undefined
            }
        });
    } catch (error) {
        console.error('Audit log failed:', error);
    }
};
