import { PrismaClient } from '@prisma/client';
import { Role } from '../src/utils/constants';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with Multi-tenant structure...');

    // 0. Create default Tenant
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'zenith-sigorta' },
        update: {},
        create: {
            name: 'Zenith Sigorta Acentesi',
            slug: 'zenith-sigorta',
            plan: 'ENTERPRISE'
        }
    });
    console.log('Tenant created:', tenant.name);

    // 1. Create Physical Branches (Şubeler)
    const branches = [
        { name: 'İstanbul Merkez Şubesi' },
        { name: 'Ankara Çankaya Şubesi' },
        { name: 'İzmir Karşıyaka Şubesi' },
        { name: 'Antalya Muratpaşa Şubesi' }
    ];

    const createdBranches = [];
    for (const b of branches) {
        const branch = await prisma.branch.create({
            data: {
                name: b.name,
                tenantId: tenant.id,
                settings: { commissionRate: 0.10 }
            }
        });
        createdBranches.push(branch);
    }

    // 2. Create Insurance Policy Types (Branşlar/Poliçe Tipleri)
    const policyTypes = [
        { name: 'Sağlık Sigortası' },
        { name: 'Kasko & Trafik' },
        { name: 'Bireysel Emeklilik (BES)' },
        { name: 'Konut & DASK' },
        { name: 'Yurtdışı Seyahat' }
    ];

    const createdPolicyTypes = [];
    for (const pt of policyTypes) {
        const policyType = await prisma.policyType.create({
            data: {
                name: pt.name,
                tenantId: tenant.id
            }
        });
        createdPolicyTypes.push(policyType);
    }

    // 3. Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Super Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sigorta.com' },
        update: { tenantId: tenant.id },
        create: {
            email: 'admin@sigorta.com',
            name: 'Ali Admin',
            password: hashedPassword,
            identityNumber: '11111111110',
            role: 'ADMIN' as any,
            tenantId: tenant.id
        }
    });

    // Branch Managers
    const manager1 = await prisma.user.upsert({
        where: { email: 'mert@sigorta.com' },
        update: { tenantId: tenant.id },
        create: {
            email: 'mert@sigorta.com',
            name: 'Mert Müdür',
            password: hashedPassword,
            identityNumber: '22222222220',
            role: 'MANAGER' as any,
            branchId: createdBranches[0].id,
            tenantId: tenant.id
        }
    });

    // Employees
    const emp1 = await prisma.user.upsert({
        where: { email: 'can@sigorta.com' },
        update: { tenantId: tenant.id },
        create: {
            email: 'can@sigorta.com',
            name: 'Can Çalışan',
            password: hashedPassword,
            identityNumber: '33333333330',
            role: 'EMPLOYEE' as any,
            branchId: createdBranches[0].id,
            tenantId: tenant.id
        }
    });

    // 4. Create Sample Sales
    const sampleSales = [
        { customer: 'Ahmet Yılmaz', policy: 'SAG-101', amount: 5000, status: 'ACTIVE', branch: createdBranches[0], policyType: createdPolicyTypes[0], user: emp1 },
        { customer: 'Mehmet Demir', policy: 'KAS-202', amount: 12000, status: 'OFFER', branch: createdBranches[1], policyType: createdPolicyTypes[1], user: manager1 },
    ];

    for (const s of sampleSales) {
        await prisma.sale.create({
            data: {
                policyNumber: s.policy,
                amount: s.amount,
                status: s.status as any,
                tenantId: tenant.id,
                branchId: s.branch.id,
                policyTypeId: s.policyType.id,
                employeeId: s.user.id,
                createdAt: new Date(Date.now() - Math.random() * 1000000000)
            }
        });
    }

    console.log('Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
