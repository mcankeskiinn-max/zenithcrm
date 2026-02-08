import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resetTestDb = async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "customers" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
};
