import { AsyncLocalStorage } from 'node:async_hooks';
import { logAudit } from './audit.util';
import { TenantBypassError } from './tenant-errors';
import { bypassAbuseDetector } from '../monitoring/bypass-abuse-detector';

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
        if (process.env.BYPASS_ABUSE_DETECTOR_ENABLED === 'true') {
            bypassAbuseDetector.register({
                userId: options.actorId,
                allowed: false,
                reason: options.reason,
                permission: actorRole as any,
                timestamp: Date.now()
            });
        }
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

    if (process.env.BYPASS_ABUSE_DETECTOR_ENABLED === 'true') {
        bypassAbuseDetector.register({
            userId: options.actorId,
            allowed: true,
            reason: options.reason,
            permission: actorRole as any,
            timestamp: Date.now()
        });
        const alert = await bypassAbuseDetector.checkAbuse(options.actorId, options.reason);
        if (alert) {
            await logAudit({
                action: 'BYPASS_ABUSE',
                resource: 'TenantIsolation',
                resourceId: options.actorId,
                userId: options.actorId,
                tenantId: options.tenantId,
                details: alert
            });
            console.warn('Bypass abuse detected', alert);
        }
    }

    return await bypassStore.run(context, fn);
};
