import { AsyncLocalStorage } from 'node:async_hooks';

type TenantContext = {
    tenantId: string;
};

const tenantStore = new AsyncLocalStorage<TenantContext>();

export const runWithTenant = <T>(tenantId: string, fn: () => T) =>
    tenantStore.run({ tenantId }, fn);

export const getTenantId = () => tenantStore.getStore()?.tenantId;

export const requireTenantId = () => {
    const tenantId = getTenantId();
    if (!tenantId) {
        throw new Error('Tenant context is missing');
    }
    return tenantId;
};
