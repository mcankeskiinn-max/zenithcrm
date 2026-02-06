import { Request, Response, NextFunction } from 'express';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const shouldSkip = (req: Request) => {
    if (SAFE_METHODS.has(req.method)) return true;

    const path = req.path || '';
    if (path.startsWith('/api/auth/login')) return true;
    if (path.startsWith('/api/auth/register')) return true;
    if (path.startsWith('/api/auth/forgot-password')) return true;
    if (path.startsWith('/api/auth/reset-password')) return true;
    if (path.startsWith('/api/auth/refresh')) return true;
    return false;
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'test') return next();

    if (shouldSkip(req)) return next();

    const cookieToken = (req.cookies && req.cookies[CSRF_COOKIE]) as string | undefined;
    const headerToken = req.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'CSRF token invalid or missing' });
    }

    next();
};

export const getCsrfCookieName = () => CSRF_COOKIE;
