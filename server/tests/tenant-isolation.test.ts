import { TenantAccessDeniedError, TenantBypassError, TenantMismatchError } from '../src/utils/tenant-errors';
import { runWithTenant, getTenantId, requireTenantId } from '../src/utils/tenant-context';
import { runWithBypass, isBypassEnabled, getBypassContext } from '../src/utils/tenant-bypass';

jest.mock('../src/monitoring/bypass-abuse-detector', () => ({
    bypassAbuseDetector: {
        register: jest.fn(),
        checkAbuse: jest.fn().mockResolvedValue(null)
    }
}));
import { applyTenantIsolation } from '../src/lib/prisma-tenant-middleware';

jest.mock('../src/utils/audit.util', () => ({
    logAudit: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/utils/tenant-context', () => {
    const actual = jest.requireActual('../src/utils/tenant-context');
    return {
        ...actual,
        getTenantId: jest.fn()
    };
});

jest.mock('../src/utils/tenant-bypass', () => {
    const actual = jest.requireActual('../src/utils/tenant-bypass');
    return {
        ...actual,
        isBypassEnabled: jest.fn()
    };
});

const mockedGetTenantId = getTenantId as jest.Mock;
const mockedIsBypassEnabled = isBypassEnabled as jest.Mock;

describe('Tenant isolation (critical coverage)', () => {
    beforeEach(() => {
        mockedGetTenantId.mockReturnValue('tenant-1');
        mockedIsBypassEnabled.mockReturnValue(false);
        process.env.TENANT_BYPASS_ROLES = 'ADMIN';
    });

    it('tenant error classes provide codes and status', () => {
        const mismatch = new TenantMismatchError('Tenant mismatch');
        const denied = new TenantAccessDeniedError();
        const bypass = new TenantBypassError();

        expect(mismatch.code).toBe('TENANT_MISMATCH');
        expect(mismatch.statusCode).toBe(403);
        expect(denied.code).toBe('TENANT_ACCESS_DENIED');
        expect(denied.statusCode).toBe(404);
        expect(bypass.code).toBe('TENANT_BYPASS_DENIED');
    });

    it('tenant context helpers work', () => {
        const { getTenantId: actualGetTenantId, requireTenantId: actualRequireTenantId } =
            jest.requireActual('../src/utils/tenant-context');
        let inside: string | undefined;
        runWithTenant('tenant-ctx', () => {
            inside = actualGetTenantId();
            expect(actualRequireTenantId()).toBe('tenant-ctx');
        });
        expect(inside).toBe('tenant-ctx');
        expect(() => actualRequireTenantId()).toThrow('Tenant context is missing');
    });

    it('bypass context allows admin role and exposes context', async () => {
        mockedIsBypassEnabled.mockReturnValue(true);
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'true';
        const result = await runWithBypass(
            { actorId: 'admin-1', actorRole: 'ADMIN', reason: 'report' },
            async () => {
                const ctx = getBypassContext();
                expect(ctx?.reason).toBe('report');
                return 'ok';
            }
        );
        expect(result).toBe('ok');
    });

    it('bypass context denies non-admin role', async () => {
        process.env.BYPASS_ABUSE_DETECTOR_ENABLED = 'true';
        await expect(
            runWithBypass(
                { actorId: 'user-1', actorRole: 'USER', reason: 'test' },
                async () => 'no'
            )
        ).rejects.toBeInstanceOf(TenantBypassError);
    });

    it('prisma middleware scopes findUnique to findFirst with tenantId', async () => {
        let handler: any;
        const prisma = {
            $use: (fn: any) => {
                handler = fn;
            }
        };
        const prismaInternal: any = {};
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = { model: 'Customer', action: 'findUnique', args: { where: { id: 'c1' } } };
        const next = jest.fn().mockResolvedValue('ok');
        await handler(params, next);

        expect(params.action).toBe('findFirst');
        expect(params.args.where.tenantId).toBe('tenant-1');
        expect(next).toHaveBeenCalled();
    });

    it('prisma middleware blocks mismatched where tenantId', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {};
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = { model: 'Customer', action: 'findMany', args: { where: { tenantId: 'other' } } };
        await expect(handler(params, jest.fn())).rejects.toBeInstanceOf(TenantMismatchError);
    });

    it('prisma middleware blocks create with tenant mismatch', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {};
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = { model: 'Customer', action: 'create', args: { data: { tenantId: 'other' } } };
        await expect(handler(params, jest.fn())).rejects.toBeInstanceOf(TenantMismatchError);
    });

    it('prisma middleware enforces relation tenant consistency', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {
            customer: { findFirst: jest.fn().mockResolvedValue(null) }
        };
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = {
            model: 'Sale',
            action: 'create',
            args: { data: { customerId: 'c1' } }
        };
        await expect(handler(params, jest.fn())).rejects.toBeInstanceOf(TenantMismatchError);
    });

    it('prisma middleware blocks update when record not found in tenant', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {
            sale: { findFirst: jest.fn().mockResolvedValue(null) }
        };
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = { model: 'Sale', action: 'update', args: { where: { id: 's1' }, data: {} } };
        await expect(handler(params, jest.fn())).rejects.toBeInstanceOf(TenantAccessDeniedError);
    });

    it('prisma middleware adds tenantId for createMany', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {
            customer: { findFirst: jest.fn().mockResolvedValue({ id: 'c1' }) }
        };
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = {
            model: 'Sale',
            action: 'createMany',
            args: { data: [{ customerId: 'c1' }] }
        };
        const next = jest.fn().mockResolvedValue('ok');
        await handler(params, next);
        expect(params.args.data[0].tenantId).toBe('tenant-1');
    });

    it('prisma middleware enforces tenantId mismatch on update', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {
            sale: { findFirst: jest.fn().mockResolvedValue({ id: 's1' }) }
        };
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = {
            model: 'Sale',
            action: 'update',
            args: { where: { id: 's1' }, data: { tenantId: 'other' } }
        };
        await expect(handler(params, jest.fn())).rejects.toBeInstanceOf(TenantMismatchError);
    });

    it('prisma middleware handles upsert tenant checks', async () => {
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {
            customer: { findFirst: jest.fn().mockResolvedValue({ id: 'c1' }) }
        };
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = {
            model: 'Sale',
            action: 'upsert',
            args: {
                where: { id: 's1' },
                create: { customerId: 'c1' },
                update: { customerId: 'c1' }
            }
        };
        const next = jest.fn().mockResolvedValue('ok');
        await handler(params, next);
        expect(params.args.create.tenantId).toBe('tenant-1');
        expect(next).toHaveBeenCalled();
    });

    it('prisma middleware skips isolation when bypass enabled', async () => {
        mockedIsBypassEnabled.mockReturnValue(true);
        let handler: any;
        const prisma = { $use: (fn: any) => (handler = fn) };
        const prismaInternal: any = {};
        applyTenantIsolation(prisma as any, prismaInternal as any);

        const params: any = { model: 'Customer', action: 'findMany', args: { where: {} } };
        const next = jest.fn().mockResolvedValue('ok');
        await handler(params, next);
        expect(next).toHaveBeenCalled();
    });
});
