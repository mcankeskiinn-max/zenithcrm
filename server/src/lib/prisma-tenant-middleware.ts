import { PrismaClient } from '@prisma/client';
import { getTenantId } from '../utils/tenant-context';
import { isBypassEnabled } from '../utils/tenant-bypass';
import { TenantAccessDeniedError, TenantMismatchError } from '../utils/tenant-errors';

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
    'Document',
    'SupportMessage'
]);

type RelationCheck = {
    field: string;
    model: string;
    relation?: string;
};

const RELATION_CHECKS: Record<string, RelationCheck[]> = {
    User: [{ field: 'branchId', model: 'Branch', relation: 'branch' }],
    Branch: [],
    Customer: [],
    PolicyType: [],
    Sale: [
        { field: 'branchId', model: 'Branch', relation: 'branch' },
        { field: 'customerId', model: 'Customer', relation: 'customer' },
        { field: 'employeeId', model: 'User', relation: 'employee' },
        { field: 'policyTypeId', model: 'PolicyType', relation: 'policyType' }
    ],
    Task: [
        { field: 'assignedToId', model: 'User', relation: 'assignedTo' },
        { field: 'customerId', model: 'Customer', relation: 'customer' },
        { field: 'policyTypeId', model: 'PolicyType', relation: 'policyType' }
    ],
    CommissionRule: [
        { field: 'branchId', model: 'Branch', relation: 'branch' },
        { field: 'policyTypeId', model: 'PolicyType', relation: 'policyType' }
    ],
    CommissionLog: [
        { field: 'saleId', model: 'Sale', relation: 'sale' },
        { field: 'employeeId', model: 'User', relation: 'employee' }
    ],
    Message: [
        { field: 'senderId', model: 'User', relation: 'sender' },
        { field: 'receiverId', model: 'User', relation: 'receiver' },
        { field: 'branchId', model: 'Branch', relation: 'branch' },
        { field: 'saleId', model: 'Sale', relation: 'sale' }
    ],
    SalesTarget: [
        { field: 'userId', model: 'User', relation: 'user' },
        { field: 'branchId', model: 'Branch', relation: 'branch' }
    ],
    Notification: [{ field: 'userId', model: 'User', relation: 'user' }],
    Document: [
        { field: 'saleId', model: 'Sale', relation: 'sale' },
        { field: 'customerId', model: 'Customer', relation: 'customer' }
    ],
    SupportMessage: [{ field: 'userId', model: 'User', relation: 'user' }]
};

const toClientName = (model: string) =>
    model.charAt(0).toLowerCase() + model.slice(1);

const getRelationId = (data: Record<string, any>, check: RelationCheck) => {
    if (!data) return undefined;
    if (data[check.field] !== undefined) return data[check.field];
    const relation = check.relation ? data[check.relation] : undefined;
    const connectId = relation?.connect?.id;
    return connectId ?? undefined;
};

const ensureTenantConsistency = async (
    prismaInternal: PrismaClient,
    tenantId: string,
    model: string,
    data: Record<string, any>
) => {
    const checks = RELATION_CHECKS[model] || [];
    if (!checks.length) return;

    for (const check of checks) {
        const relationId = getRelationId(data, check);
        if (!relationId) continue;
        const client = (prismaInternal as any)[toClientName(check.model)];
        if (!client?.findFirst) continue;
        const related = await client.findFirst({
            where: { id: relationId, tenantId }
        });
        if (!related) {
            throw new TenantMismatchError('Foreign key tenant mismatch', {
                model,
                field: check.field,
                relationModel: check.model,
                relationId
            });
        }
    }
};

const guardTenantIdMismatch = (where: Record<string, any> | undefined, tenantId: string) => {
    if (!where) return;
    if (typeof where.tenantId === 'string' && where.tenantId !== tenantId) {
        throw new TenantMismatchError('Tenant mismatch in where clause', {
            whereTenantId: where.tenantId,
            tenantId
        });
    }
};

export const applyTenantIsolation = (prisma: PrismaClient, prismaInternal: PrismaClient) => {
    prisma.$use(async (params, next) => {
        const tenantId = getTenantId();
        const model = params.model;

        if (!tenantId || !model || !TENANT_SCOPED_MODELS.has(model)) {
            return next(params);
        }

        if (isBypassEnabled()) {
            return next(params);
        }

        const action = params.action;
        params.args = params.args || {};

        guardTenantIdMismatch(params.args.where, tenantId);

        if (action === 'findUnique' || action === 'findUniqueOrThrow') {
            params.action = action === 'findUniqueOrThrow' ? 'findFirstOrThrow' : 'findFirst';
            params.args.where = { ...(params.args.where || {}), tenantId };
            return next(params);
        }

        if (action === 'create') {
            const data = params.args.data || {};
            if (data.tenantId && data.tenantId !== tenantId) {
                throw new TenantMismatchError('Tenant mismatch on create', {
                    model,
                    tenantId,
                    payloadTenantId: data.tenantId
                });
            }
            await ensureTenantConsistency(prismaInternal, tenantId, model, data);
            params.args.data = { ...data, tenantId: data.tenantId || tenantId };
            return next(params);
        }

        if (action === 'createMany') {
            const dataList = Array.isArray(params.args.data) ? params.args.data : [];
            for (const item of dataList) {
                if (item.tenantId && item.tenantId !== tenantId) {
                    throw new TenantMismatchError('Tenant mismatch on createMany', {
                        model,
                        tenantId,
                        payloadTenantId: item.tenantId
                    });
                }
                await ensureTenantConsistency(prismaInternal, tenantId, model, item);
            }
            params.args.data = dataList.map((item: any) => ({
                ...item,
                tenantId: item.tenantId || tenantId
            }));
            return next(params);
        }

        if (action === 'update' || action === 'delete') {
            const where = params.args.where || {};
            const client = (prismaInternal as any)[toClientName(model)];
            if (client?.findFirst) {
                const existing = await client.findFirst({
                    where: { ...where, tenantId }
                });
                if (!existing) {
                    throw new TenantAccessDeniedError();
                }
            }

            if (action === 'update') {
                const data = params.args.data || {};
                if (data.tenantId && data.tenantId !== tenantId) {
                    throw new TenantMismatchError('Tenant mismatch on update', {
                        model,
                        tenantId,
                        payloadTenantId: data.tenantId
                    });
                }
                await ensureTenantConsistency(prismaInternal, tenantId, model, data);
            }
            return next(params);
        }

        if (action === 'upsert') {
            const createData = params.args.create || {};
            const updateData = params.args.update || {};
            if (createData.tenantId && createData.tenantId !== tenantId) {
                throw new TenantMismatchError('Tenant mismatch on upsert create', {
                    model,
                    tenantId,
                    payloadTenantId: createData.tenantId
                });
            }
            if (updateData.tenantId && updateData.tenantId !== tenantId) {
                throw new TenantMismatchError('Tenant mismatch on upsert update', {
                    model,
                    tenantId,
                    payloadTenantId: updateData.tenantId
                });
            }
            await ensureTenantConsistency(prismaInternal, tenantId, model, createData);
            await ensureTenantConsistency(prismaInternal, tenantId, model, updateData);
            params.args.create = { ...createData, tenantId: createData.tenantId || tenantId };
            return next(params);
        }

        if (['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'].includes(action)) {
            params.args.where = { ...(params.args.where || {}), tenantId };
            return next(params);
        }

        return next(params);
    });
};
