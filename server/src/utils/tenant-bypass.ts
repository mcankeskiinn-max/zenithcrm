import { AsyncLocalStorage } from 'node:async_hooks';
import { logAudit } from './audit.util';
import { TenantBypassError } from './tenant-errors';

type BypassContext = {
    enabled: boolean;
    reason: string;
    actorId?: string;
    tenantId?: string;
    startedAt: Date;
};

const bypassStore = new AsyncLocalStorage<BypassContext>();

const parseAllowedRoles = () => {
    const raw = process.env.TENANT_BYPASS_ROLES || 'ADMIN';
    return raw
        .split(',')
        .map((role) => role.trim().toUpperCase())
        .filter(Boolean);
};

export const isBypassEnabled = () => Boolean(bypassStore.getStore()?.enabled);

export const getBypassContext = () => bypassStore.getStore();

export const runWithBypass = async <T>(
    options: {
        actorId: string;
        actorRole: string;
        tenantId?: string;
        reason: string;
    },
    fn: () => Promise<T>
) => {
    const allowedRoles = parseAllowedRoles();
    const actorRole = options.actorRole?.toUpperCase();
    if (!allowedRoles.includes(actorRole)) {
        throw new TenantBypassError('Tenant bypass denied for role', {
            role: options.actorRole,
            allowedRoles
        });
    }

    const context: BypassContext = {
        enabled: true,
        reason: options.reason,
        actorId: options.actorId,
        tenantId: options.tenantId,
        startedAt: new Date()
    };

    await logAudit({
        action: 'BYPASS',
        resource: 'TenantIsolation',
        resourceId: options.actorId,
        userId: options.actorId,
        tenantId: options.tenantId,
        details: {
            reason: options.reason,
            role: options.actorRole
        }
    });

    return await bypassStore.run(context, fn);
};
