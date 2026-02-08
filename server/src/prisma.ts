import { PrismaClient } from '@prisma/client';
import { getTenantId } from './utils/tenant-context';

const TENANT_SCOPED_MODELS = new Set([
    'User',
    'Branch',
    'Customer',
    'PolicyType',
    'Sale',
    'Task',
    'CommissionRule',
    'CommissionLog',
    'Message',
    'AuditLog',
    'SalesTarget',
    'Notification',
    'Document'
]);

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
    const tenantId = getTenantId();
    const model = params.model;

    if (!tenantId || !model || !TENANT_SCOPED_MODELS.has(model)) {
        return next(params);
    }

    const action = params.action;
    params.args = params.args || {};

    const guardTenantIdMismatch = () => {
        const where = params.args?.where;
        if (where && typeof where.tenantId === 'string' && where.tenantId !== tenantId) {
            throw new Error('Tenant isolation violation: tenantId mismatch');
        }
    };

    guardTenantIdMismatch();

    if (action === 'create') {
        const data = params.args.data || {};
        if (data.tenantId && data.tenantId !== tenantId) {
            throw new Error('Tenant isolation violation: create tenantId mismatch');
        }
        params.args.data = { ...data, tenantId: data.tenantId || tenantId };
        return next(params);
    }

    if (action === 'createMany') {
        const dataList = Array.isArray(params.args.data) ? params.args.data : [];
        params.args.data = dataList.map((item: any) => {
            if (item.tenantId && item.tenantId !== tenantId) {
                throw new Error('Tenant isolation violation: createMany tenantId mismatch');
            }
            return { ...item, tenantId: item.tenantId || tenantId };
        });
        return next(params);
    }

    if (['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'].includes(action)) {
        params.args.where = { ...(params.args.where || {}), tenantId };
        return next(params);
    }

    return next(params);
});

export default prisma;
