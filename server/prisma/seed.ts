import { PrismaClient } from '@prisma/client';
import { Role } from '../src/utils/constants';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with separated Branch and PolicyType data...');

    // 1. Create Physical Branches (Şubeler)
    // ... branches array ...
    const branches = [
        { name: 'İstanbul Merkez Şubesi' },
        { name: 'Ankara Çankaya Şubesi' },
        { name: 'İzmir Karşıyaka Şubesi' },
        { name: 'Antalya Muratpaşa Şubesi' }
    ];

    const createdBranches = [];
    for (const b of branches) {
        const branch = await prisma.branch.upsert({
            where: { name: b.name },
            update: {},
            create: {
                name: b.name,
                settings: JSON.stringify({ commissionRate: 0.10 }) // Default office rate
            }
        });
        createdBranches.push(branch);
    }

    // 2. Create Insurance Policy Types (Branşlar/Poliçe Tipleri)
    // ... policyTypes array ...
    const policyTypes = [
        { name: 'Sağlık Sigortası' },
        { name: 'Kasko & Trafik' },
        { name: 'Bireysel Emeklilik (BES)' },
        { name: 'Konut & DASK' },
        { name: 'Yurtdışı Seyahat' }
    ];

    const createdPolicyTypes = [];
    for (const pt of policyTypes) {
        const policyType = await prisma.policyType.upsert({
            where: { name: pt.name },
            update: {},
            create: { name: pt.name }
        });
        createdPolicyTypes.push(policyType);
    }

    // 3. Create Users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Super Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@sigorta.com' },
        update: {},
        create: {
            email: 'admin@sigorta.com',
            name: 'Ali Admin',
            password: hashedPassword,
            identityNumber: '11111111110',
            role: 'ADMIN' as any
        }
    });

    // Branch Managers
    const manager1 = await prisma.user.upsert({
        where: { email: 'mert@sigorta.com' },
        update: {},
        create: {
            email: 'mert@sigorta.com',
            name: 'Mert Müdür',
            password: hashedPassword,
            identityNumber: '22222222220',
            role: 'MANAGER' as any,
            branchId: createdBranches[0].id
        }
    });

    // Employees
    const emp1 = await prisma.user.upsert({
        where: { email: 'can@sigorta.com' },
        update: {},
        create: {
            email: 'can@sigorta.com',
            name: 'Can Çalışan',
            password: hashedPassword,
            identityNumber: '33333333330',
            role: Role.EMPLOYEE,
            branchId: createdBranches[0].id
        }
    });

    const emp2 = await prisma.user.upsert({
        where: { email: 'eda@sigorta.com' },
        update: {},
        create: {
            email: 'eda@sigorta.com',
            name: 'Eda Esnek',
            password: hashedPassword,
            identityNumber: '44444444440',
            role: Role.EMPLOYEE,
            branchId: createdBranches[1].id
        }
    });

    console.log('Users, Branches, and PolicyTypes seeding completed.');

    // 4. Create Sample Sales
    const sampleSales = [
        { customer: 'Ahmet Yılmaz', policy: 'SAG-101', amount: 5000, status: 'ACTIVE', branch: createdBranches[0], policyType: createdPolicyTypes[0], user: emp1 },
        { customer: 'Mehmet Demir', policy: 'KAS-202', amount: 12000, status: 'OFFER', branch: createdBranches[1], policyType: createdPolicyTypes[1], user: emp2 },
        { customer: 'Ayşe Kaya', policy: 'BES-303', amount: 1500, status: 'LEAD', branch: createdBranches[2], policyType: createdPolicyTypes[2], user: emp1 },
        { customer: 'Fatma Şahin', policy: 'KON-404', amount: 3000, status: 'ACTIVE', branch: createdBranches[3], policyType: createdPolicyTypes[3], user: admin },
        { customer: 'Zeynep Çelik', policy: 'SAG-105', amount: 7500, status: 'CANCELLED', branch: createdBranches[0], policyType: createdPolicyTypes[0], user: emp1 },
    ];

    for (const s of sampleSales) {
        await prisma.sale.create({
            data: {
                customerName: s.customer,
                policyNumber: s.policy,
                amount: s.amount,
                status: s.status as any,
                branchId: s.branch.id,
                policyTypeId: s.policyType.id,
                employeeId: s.user.id,
                createdAt: new Date(Date.now() - Math.random() * 1000000000)
            }
        });
    }

    // 5. Create Tasks
    const tasksData = [
        { title: 'Ahmet Beyi poliçe yenileme için ara', description: 'Vadesi yaklaşıyor', dueDate: new Date(Date.now() + 86400000), assignedToId: emp1.id },
        { title: 'Kasko teklifi hazırla', description: 'Mehmet Demir için Opel Astra', dueDate: new Date(), assignedToId: emp2.id }
    ];

    for (const t of tasksData) {
        await prisma.task.create({ data: t });
    }

    // 6. Create Commission Rules
    await prisma.commissionRule.create({
        data: {
            name: 'Sağlık Bahar Kampanyası',
            branchId: createdBranches[0].id,
            policyTypeId: createdPolicyTypes[0].id,
            formula: 'ratio:0.18',
            validFrom: new Date('2024-01-01'),
            conditions: JSON.stringify({ minAmount: 1000 })
        }
    });

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
