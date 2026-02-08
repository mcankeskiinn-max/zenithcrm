import type { Request, Response, NextFunction } from 'express';

export type IncludeTenantMode = 'strict' | 'lenient' | 'warn';

const sanitize = (value: any, tenantId: string, mode: IncludeTenantMode, path: string[] = []): any => {
    if (!value) return value;
    if (Array.isArray(value)) {
        return value
            .map((item, idx) => sanitize(item, tenantId, mode, [...path, String(idx)]))
            .filter((item) => item !== null);
    }

    if (typeof value === 'object') {
        if (typeof value.tenantId === 'string' && value.tenantId !== tenantId) {
            if (mode === 'strict') {
                throw new Error(`Include tenant mismatch at ${path.join('.') || 'root'}`);
            }
            if (mode === 'warn') {
                console.warn('Include tenant mismatch', { path, expected: tenantId, actual: value.tenantId });
            }
            return null;
        }

        const next: Record<string, any> = {};
        for (const [key, val] of Object.entries(value)) {
            next[key] = sanitize(val, tenantId, mode, [...path, key]);
        }
        return next;
    }

    return value;
};

export const includeTenantValidator = (mode: IncludeTenantMode = 'strict') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return next();

        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            try {
                const sanitized = sanitize(body, tenantId, mode);
                return originalJson(sanitized);
            } catch (err) {
                return res.status(403).json({ error: 'Include tenant mismatch' });
            }
        };
        next();
    };
};
