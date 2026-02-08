@'
import { TenantAccessDeniedError, TenantMismatchError } from './tenant-errors';

export type TenantContext = {
    tenantId: string;
    userId: string;
    role: string;
};

export const TENANT_HEADER_KEY = 'x-tenant-id';
export const TENANT_SLUG_HEADER = 'x-tenant-slug';

export const assertTenantMatch = (expectedTenantId: string, actualTenantId?: string) => {
    if (!actualTenantId) {
        throw new TenantMismatchError('Tenant context missing');
    }
    if (expectedTenantId !== actualTenantId) {
        throw new TenantMismatchError('Tenant mismatch detected', {
            expectedTenantId,
            actualTenantId
        });
    }
};

export const assertTenantAccess = (exists: boolean, details?: Record<string, unknown>) => {
    if (!exists) {
        throw new TenantAccessDeniedError('Record not found or access denied', details);
    }
};

export const normalizeTenantSlug = (value?: string) => value?.trim().toLowerCase();
