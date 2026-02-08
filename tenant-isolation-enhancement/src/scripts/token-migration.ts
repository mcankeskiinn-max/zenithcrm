import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TOKEN_VERSION = 2;

const rotateRefreshTokens = async () => {
    // Invalidate all refresh tokens to force re-login
    await prisma.refreshToken.deleteMany({});
};

const issueNewToken = (userId: string, role: string, tenantId: string) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');
    return jwt.sign({ userId, role, tenantId, ver: TOKEN_VERSION }, secret, { expiresIn: '15m' });
};

const run = async () => {
    await rotateRefreshTokens();
    console.log('All refresh tokens revoked. Users must re-login to receive v2 tokens.');
    await prisma.$disconnect();
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
