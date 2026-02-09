import { loginValidation } from '../src/controllers/auth.controller';
import { validateRequest } from '../src/middleware/validate.middleware';
import { csrfProtection, getCsrfCookieName } from '../src/middleware/csrf.middleware';
import { authorize } from '../src/middleware/auth.middleware';
import { Role } from '../src/utils/constants';

const makeRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const runValidationChain = async (req: any, res: any, next: jest.Mock) => {
    for (const rule of loginValidation) {
        // eslint-disable-next-line no-await-in-loop
        await rule.run(req);
    }
    validateRequest(req as any, res as any, next as any);
};

describe('security baseline (auth + csrf)', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    it('validation rejects missing email/password', async () => {
        const req: any = { body: { email: '', password: '' } };
        const res = makeRes();
        const next = jest.fn();

        await runValidationChain(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('validation passes for valid email/password', async () => {
        const req: any = { body: { email: 'user@test.com', password: '123456' } };
        const res = makeRes();
        const next = jest.fn();

        await runValidationChain(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('csrf blocks state-changing requests without token', () => {
        process.env.NODE_ENV = 'production';
        const req: any = { method: 'POST', path: '/api/customers', cookies: {}, headers: {} };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('csrf allows bearer auth without csrf token', () => {
        process.env.NODE_ENV = 'production';
        const req: any = {
            method: 'POST',
            path: '/api/customers',
            cookies: {},
            headers: { authorization: 'Bearer token' }
        };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(next).toHaveBeenCalled();
    });

    it('csrf allows safe methods', () => {
        process.env.NODE_ENV = 'production';
        const req: any = { method: 'GET', path: '/api/customers', cookies: {}, headers: {} };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(next).toHaveBeenCalled();
    });

    it('csrf allows HEAD and OPTIONS methods', () => {
        process.env.NODE_ENV = 'production';
        const res = makeRes();
        const next = jest.fn();

        const headReq: any = { method: 'HEAD', path: '/api/customers', cookies: {}, headers: {} };
        csrfProtection(headReq as any, res as any, next as any);
        expect(next).toHaveBeenCalled();

        next.mockClear();
        const optReq: any = { method: 'OPTIONS', path: '/api/customers', cookies: {}, headers: {} };
        csrfProtection(optReq as any, res as any, next as any);
        expect(next).toHaveBeenCalled();
    });

    it('csrf skips auth endpoints', () => {
        process.env.NODE_ENV = 'production';
        const req: any = { method: 'POST', path: '/api/auth/login', cookies: {}, headers: {} };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(next).toHaveBeenCalled();
    });

    it('csrf skips other auth endpoints', () => {
        process.env.NODE_ENV = 'production';
        const res = makeRes();
        const next = jest.fn();

        const endpoints = [
            '/api/auth/register',
            '/api/auth/forgot-password',
            '/api/auth/reset-password',
            '/api/auth/refresh'
        ];

        for (const path of endpoints) {
            const req: any = { method: 'POST', path, cookies: {}, headers: {} };
            csrfProtection(req as any, res as any, next as any);
            expect(next).toHaveBeenCalled();
            next.mockClear();
        }
    });

    it('csrf allows matching cookie/header token', () => {
        process.env.NODE_ENV = 'production';
        const req: any = {
            method: 'POST',
            path: '/api/customers',
            cookies: { 'XSRF-TOKEN': 't1' },
            headers: { 'x-csrf-token': 't1' }
        };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(next).toHaveBeenCalled();
    });

    it('csrf blocks when cookie/header mismatch', () => {
        process.env.NODE_ENV = 'production';
        const req: any = {
            method: 'POST',
            path: '/api/customers',
            cookies: { 'XSRF-TOKEN': 't1' },
            headers: { 'x-csrf-token': 't2' }
        };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('csrf bypasses when NODE_ENV is test', () => {
        process.env.NODE_ENV = 'test';
        const req: any = { method: 'POST', path: '/api/customers', cookies: {}, headers: {} };
        const res = makeRes();
        const next = jest.fn();

        csrfProtection(req as any, res as any, next as any);

        expect(next).toHaveBeenCalled();
    });

    it('exposes csrf cookie name', () => {
        expect(getCsrfCookieName()).toBe('XSRF-TOKEN');
    });

    it('authorize rejects when role not allowed', () => {
        const req: any = { user: { role: Role.EMPLOYEE } };
        const res = makeRes();
        const next = jest.fn();

        authorize(Role.ADMIN)(req as any, res as any, next as any);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
