import { logAudit } from '../../../server/src/utils/audit.util';

export type AuditPayload = {
    userId?: string;
    tenantId?: string;
    action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'UNAUTHORIZED' | 'BYPASS';
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
};

export const auditLogger = async (payload: AuditPayload) => {
    const entry = {
        ...payload,
        timestamp: new Date().toISOString()
    };
    console.info(JSON.stringify({ level: 'audit', ...entry }));
    await logAudit({
        userId: payload.userId,
        tenantId: payload.tenantId,
        action: payload.action,
        resource: payload.resource,
        resourceId: payload.resourceId,
        details: payload.details,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent
    });
};
