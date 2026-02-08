import { AsyncLocalStorage } from 'node:async_hooks';

type TenantContext = {
    tenantId: string;
};

const tenantStore = new AsyncLocalStorage<TenantContext>();

export const runWithTenant = (tenantId: string, fn: () => void) =>
    tenantStore.run({ tenantId }, fn);

export const getTenantId = () => tenantStore.getStore()?.tenantId;
