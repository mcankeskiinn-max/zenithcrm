import { authenticate, authorize } from '../src/middleware/auth.middleware';
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

const makeReq = (headers: Record<string, string> = {}) => {
    const normalized: Record<string, string> = {};
    Object.keys(headers).forEach((key) => {
        normalized[key.toLowerCase()] = headers[key];
    });
    return {
        headers: normalized,
        header: (name: string) => normalized[name.toLowerCase()]
    } as any;
};

describe('auth middleware (tenant critical)', () => {
    beforeEach(() => {
        (prisma.user.findUnique as jest.Mock).mockReset();
        (jwt.verify as jest.Mock).mockReset();
    });

    it('returns 401 when token missing', async () => {
        const req = makeReq({});
        const res = makeRes();
        const next = jest.fn();
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_TOKEN' }));
    });

    it('returns 401 on token expired', async () => {
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockImplementation(() => {
            const err: any = new Error('expired');
            err.name = 'TokenExpiredError';
            throw err;
        });
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TOKEN_EXPIRED' }));
    });

    it('returns 401 when user not found', async () => {
        const req = makeReq({ authorization: 'Bearer token' });
        const res = makeRes();
        const next = jest.fn();
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', tenantId: 't1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'USER_NOT_FOUND' }));
    });

    it('returns 403 when user inactive or locked', async () => {
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
            isActive: false,
            lockedUntil: null,
            tenant: { slug: 't1' }
        });
        await authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCOUNT_DEACTIVATED' }));
    });

    it('returns 401 on tenant mismatch', async () => {
        const req = makeReq({ authorization: 'Bearer token', 'x-tenant-id': 't2' });
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
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TENANT_MISMATCH' }));
    });

    it('calls next on success', async () => {
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
            lockedUntil: null,
            tenant: { slug: 't1' }
        });
        await authenticate(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
    });
});

describe('authorize middleware', () => {
    it('rejects when no user', () => {
        const req: any = {};
        const res = makeRes();
        const next = jest.fn();
        authorize(Role.ADMIN)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects when role not allowed', () => {
        const req: any = { user: { role: Role.EMPLOYEE } };
        const res = makeRes();
        const next = jest.fn();
        authorize(Role.ADMIN)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('passes when role allowed', () => {
        const req: any = { user: { role: Role.ADMIN } };
        const res = makeRes();
        const next = jest.fn();
        authorize(Role.ADMIN)(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});


