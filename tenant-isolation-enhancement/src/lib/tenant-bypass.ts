import { BypassPermission, BYPASS_ROLE_MAP } from '../types/bypass.types';
import { auditBypass } from './audit-logger';

export type BypassRequest = {
    permission: BypassPermission;
    reason: string;
    requestedBy: string;
    requesterRole: string;
    affectedTenants?: string[];
    operation?: string;
};

const isEnabled = () => String(process.env.BYPASS_ENABLED || 'true') === 'true';
const requireApproval = () => String(process.env.BYPASS_REQUIRE_APPROVAL || 'false') === 'true';

const isRoleAllowed = (role: string, permission: BypassPermission) => {
    const allowed = BYPASS_ROLE_MAP[role as keyof typeof BYPASS_ROLE_MAP] || [];
    return allowed.includes(permission);
};

export const runWithBypass = async <T>(
    fn: () => Promise<T>,
    request: BypassRequest
): Promise<T> => {
    if (!isEnabled()) {
        throw new Error('Tenant bypass disabled');
    }

    if (!request.reason || request.reason.trim().length < 5) {
        throw new Error('Bypass reason required');
    }

    if (!isRoleAllowed(request.requesterRole, request.permission)) {
        throw new Error('Insufficient permissions for tenant bypass');
    }

    if (requireApproval()) {
        throw new Error('Bypass approval required');
    }

    const start = Date.now();
    try {
        const result = await fn();
        await auditBypass({
            ...request,
            success: true,
            durationMs: Date.now() - start,
            recordCount: Array.isArray(result) ? result.length : undefined
        });
        return result;
    } catch (error: any) {
        await auditBypass({
            ...request,
            success: false,
            durationMs: Date.now() - start,
            error: error?.message || 'Unknown error'
        });
        throw error;
    }
};
