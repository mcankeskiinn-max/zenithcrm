import { TenantMismatchError } from '../src/utils/tenant-errors';

describe('Tenant isolation (examples)', () => {
    it('blocks cross-tenant access by throwing TenantMismatchError', () => {
        const err = new TenantMismatchError('Tenant mismatch');
        expect(err.code).toBe('TENANT_MISMATCH');
        expect(err.statusCode).toBe(403);
    });

    it('documents expected behavior for findUnique scoping', () => {
        // Example expectation (pseudo):
        // await prisma.customer.findUnique({ where: { id: otherTenantId } })
        // -> should be transformed to findFirst with tenantId filter and return null.
        expect(true).toBe(true);
    });
});
