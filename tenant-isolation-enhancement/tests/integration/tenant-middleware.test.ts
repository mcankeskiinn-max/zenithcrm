import { TenantMismatchError } from '../../../server/src/utils/tenant-errors';

describe('Tenant middleware', () => {
    it('creates tenant mismatch error', () => {
        const err = new TenantMismatchError('Tenant mismatch');
        expect(err.code).toBe('TENANT_MISMATCH');
    });
});
