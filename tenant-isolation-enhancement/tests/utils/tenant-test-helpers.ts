import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuthToken(payload: {
    tenantId: number;
    role: string;
    userId?: number;
}) {
    const user = await prisma.user.create({
        data: {
            tenantId: String(payload.tenantId),
            role: payload.role as any,
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
            password: 'hashed',
            isActive: true
        }
    });

    return jwt.sign(
        { userId: user.id, tenantId: user.tenantId, role: payload.role },
        process.env.JWT_SECRET || 'test'
    );
}

export async function createTamperedToken(originalToken: string, modifications: Record<string, any>) {
    const decoded: any = jwt.decode(originalToken);
    const tampered = { ...decoded, ...modifications };
    return jwt.sign(tampered, process.env.JWT_SECRET || 'test');
}

export async function createCustomer(data: { tenantId: number }) {
    return prisma.customer.create({
        data: {
            tenantId: String(data.tenantId),
            firstName: 'Test',
            lastName: 'Customer'
        }
    });
}


export async function createPolicyWithCrossTenantCustomer(input: { policyTenant: number; customerTenant: number }) {
    const customer = await prisma.customer.create({
        data: {
            tenantId: String(input.customerTenant),
            firstName: 'X',
            lastName: 'Y'
        }
    });

    const policy = await prisma.sale.create({
        data: {
            tenantId: String(input.policyTenant),
            amount: 1000,
            branchId: 'dummy-branch',
            employeeId: 'dummy-user',
            policyTypeId: 'dummy-policy',
            customerId: customer.id
        }
    });

    return policy;
}
