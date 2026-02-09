import { authenticate } from '../src/middleware/auth.middleware';
import { Role } from '../src/utils/constants';

jest.mock('../src/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn()
        }
    }
}));

jest.mock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
        verify: jest.fn()
    }
}));

jest.mock('../src/utils/tenant-context', () => ({
    runWithTenant: (_tenantId: string, fn: () => void) => fn()
}));

import prisma from '../src/prisma';
import jwt from 'jsonwebtoken';

const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const makeReq = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
    const normalized: Record<string, string> = {};
    Object.keys(headers).forEach((key) => {
        normalized[key.toLowerCase()] = headers[key];
    });
    return {
        headers: normalized,
        cookies,
        header: (name: string) => normalized[name.toLowerCase()]
    } as any;
};

describe('auth middleware extra branches', () => {
    const originalSecret = process.env.JWT_SECRET;

    beforeEach(() => {
        (prisma.user.findUnique as jest.Mock).mockReset();
        (jwt.verify as jest.Mock).mockReset();
        process.env.JWT_SECRET = 'test-secret';
    });

    afterAll(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it('uses cookie token when bearer token is null/undefined', async () => {
        const req = makeReq({ authorization: 'Bearer null' }, { access_token: 'cookie-token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', tenantId: 't1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'u1',
            email: 'u@test.com',
            role: Role.ADMIN,
            branchId: null,
            tenantId: 't1',
            isActive: true,
            lockedUntil: null,
            tenant: { slug: 't1' }
        });
        await authenticate(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('returns 500 when JWT_SECRET missing', async () => {
        process.env.JWT_SECRET = '';
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 401 for invalid token errors', async () => {
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('bad token');
        });
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_TOKEN' }));
    });

    it('returns 403 when user locked', async () => {
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', tenantId: 't1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'u1',
            email: 'u@test.com',
            role: Role.ADMIN,
            branchId: null,
            tenantId: 't1',
            isActive: true,
            lockedUntil: new Date(Date.now() + 60_000),
            tenant: { slug: 't1' }
        });
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCOUNT_LOCKED' }));
    });

    it('returns 401 when decoded tenantId mismatches user tenantId', async () => {
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', tenantId: 't1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'u1',
            email: 'u@test.com',
            role: Role.ADMIN,
            branchId: null,
            tenantId: 't2',
            isActive: true,
            lockedUntil: null,
            tenant: { slug: 't2' }
        });
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when header tenant slug mismatches', async () => {
        const req = makeReq({ authorization: 'Bearer token', 'x-tenant-slug': 'slug-a' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', tenantId: 't1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'u1',
            email: 'u@test.com',
            role: Role.ADMIN,
            branchId: null,
            tenantId: 't1',
            isActive: true,
            lockedUntil: null,
            tenant: { slug: 'slug-b' }
        });
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 500 on unexpected errors', async () => {
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', tenantId: 't1' });
        (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('db down'));
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'AUTH_ERROR' }));
    });
});
