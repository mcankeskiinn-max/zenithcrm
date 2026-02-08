import { BypassPermission } from '../types/bypass.types';

export type BypassAuditLog = {
    timestamp: string;
    userId: string;
    userRole: string;
    permission: BypassPermission;
    reason: string;
    operation?: string;
    affectedTenants?: string[];
    recordCount?: number;
    durationMs: number;
    success: boolean;
    error?: string;
};

export const auditBypass = async (entry: {
    permission: BypassPermission;
    reason: string;
    requestedBy: string;
    requesterRole: string;
    affectedTenants?: string[];
    operation?: string;
    recordCount?: number;
    durationMs: number;
    success: boolean;
    error?: string;
}) => {
    const log: BypassAuditLog = {
        timestamp: new Date().toISOString(),
        userId: entry.requestedBy,
        userRole: entry.requesterRole,
        permission: entry.permission,
        reason: entry.reason,
        operation: entry.operation,
        affectedTenants: entry.affectedTenants,
        recordCount: entry.recordCount,
        durationMs: entry.durationMs,
        success: entry.success,
        error: entry.error
    };

    console.info(JSON.stringify({ level: 'audit', type: 'TENANT_BYPASS', ...log }));
};
