export enum BypassPermission {
    SYSTEM_MAINTENANCE = 'system:maintenance',
    CROSS_TENANT_REPORT = 'report:cross-tenant',
    DATA_MIGRATION = 'data:migration'
}

export type BypassRole = 'SUPER_ADMIN' | 'SYSTEM_JOB' | 'DATA_ANALYST';

export const BYPASS_ROLE_MAP: Record<BypassRole, BypassPermission[]> = {
    SUPER_ADMIN: [
        BypassPermission.SYSTEM_MAINTENANCE,
        BypassPermission.CROSS_TENANT_REPORT,
        BypassPermission.DATA_MIGRATION
    ],
    SYSTEM_JOB: [
        BypassPermission.CROSS_TENANT_REPORT,
        BypassPermission.DATA_MIGRATION
    ],
    DATA_ANALYST: [
        BypassPermission.CROSS_TENANT_REPORT
    ]
};

export const MAX_BYPASS_ATTEMPTS = 10;
export const BYPASS_TIME_WINDOW_MINUTES = 60;
