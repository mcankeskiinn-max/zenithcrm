import { PrismaClient } from '@prisma/client';
import { applyTenantIsolation } from './lib/prisma-tenant-middleware';

const prisma = new PrismaClient();
const prismaInternal = new PrismaClient();

applyTenantIsolation(prisma, prismaInternal);

export { prismaInternal };
export default prisma;
