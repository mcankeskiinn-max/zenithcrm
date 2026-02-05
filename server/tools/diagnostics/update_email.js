const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const targetEmail = 'mcankeskiinn@gmail.com';
        const oldEmail = 'admin@sigorta.com';

        const user = await prisma.user.update({
            where: { email: oldEmail },
            data: { email: targetEmail }
        });

        console.log('SUCCESS: User email updated!');
        console.log(`Old: ${oldEmail}`);
        console.log(`New: ${user.email}`);

    } catch (error) {
        console.error('Update failed. User might not exist or target email already taken.');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
