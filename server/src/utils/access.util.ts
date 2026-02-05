import { Role } from './constants';
import type { Request } from 'express';

export type AuthUser = NonNullable<Request['user']>;

export const applySaleScope = (where: any, user: AuthUser) => {
    where.tenantId = user.tenantId;

    if (user.role === Role.ADMIN) {
        return where;
    }

    if (user.role === Role.MANAGER) {
        if (user.branchId) {
            where.branchId = user.branchId;
        } else {
            where.employeeId = user.id;
        }
        return where;
    }

    where.employeeId = user.id;
    return where;
};

export const canAccessSale = (user: AuthUser, sale: { branchId: string; employeeId: string }) => {
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.MANAGER) {
        return Boolean(user.branchId) && sale.branchId === user.branchId;
    }
    return sale.employeeId === user.id;
};

export const canAccessCustomerBySales = (user: AuthUser, sales: { branchId: string; employeeId: string }[]) => {
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.MANAGER) {
        if (user.branchId) {
            return sales.some((s) => s.branchId === user.branchId);
        }
        return sales.some((s) => s.employeeId === user.id);
    }
    return sales.some((s) => s.employeeId === user.id);
};
