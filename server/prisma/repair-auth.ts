import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting admin password...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Find or create default tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'zenith-sigorta' },
        update: {},
        create: {
            name: 'Zenith Sigorta Acentesi',
            slug: 'zenith-sigorta',
            plan: 'ENTERPRISE'
        }
    });

    const user = await prisma.user.upsert({
        where: { email: 'admin@sigorta.com' },
        update: {
            password: hashedPassword,
            isActive: true
        },
        create: {
            email: 'admin@sigorta.com',
            name: 'Ali Admin',
            password: hashedPassword,
            identityNumber: '11111111110',
            role: 'ADMIN' as any,
            tenantId: tenant.id
        }
    });

    console.log('Admin user updated/created:', user.email);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
