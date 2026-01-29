import { Role, SaleStatus, Priority } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface IUser {
    id: string;
    email: string;
    name: string;
    role: Role;
    branchId?: string | null;
    isActive: boolean;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBranch {
    id: string;
    name: string;
    settings?: { commissionRate?: number;[key: string]: unknown };
    createdAt: Date;
    updatedAt: Date;
}

export interface ICustomer {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    identityNumber?: string | null;
    address?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ISale {
    id: string;
    customerName: string;
    customerPhone?: string | null;
    customerEmail?: string | null;
    policyNumber?: string | null;
    amount: Decimal | number;
    status: SaleStatus;
    branchId: string;
    employeeId: string;
    policyTypeId: string;
    saleDate?: Date | null;
    startDate?: Date | null;
    endDate?: Date | null;
    cancelReason?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    customerId?: string | null;
}

export interface ITask {
    id: string;
    title: string;
    description?: string | null;
    dueDate: Date;
    isCompleted: boolean;
    priority: Priority;
    assignedToId: string;
    createdAt: Date;
    updatedAt: Date;
    customerId?: string | null;
    saleId?: string | null;
}

export interface IPolicyType {
    id: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMessage {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    branchId?: string | null;
    isRead: boolean;
    createdAt: Date;
}

export interface INotification {
    id: string;
    title: string;
    content: string;
    type: string;
    isRead: boolean;
    userId: string;
    createdAt: Date;
}
