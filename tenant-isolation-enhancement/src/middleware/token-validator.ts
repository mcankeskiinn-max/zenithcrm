import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { TENANT_HEADER_KEY, TENANT_SLUG_HEADER } from '../utils/tenant-guards';

export type TokenPayloadV2 = {
    userId: string;
    role: string;
    tenantId: string;
    ver: 2;
};

export const TOKEN_GRACE_DAYS = Number(process.env.TOKEN_GRACE_DAYS || 7);
const GRACE_MS = TOKEN_GRACE_DAYS * 24 * 60 * 60 * 1000;

export const validateTokenWithTenant = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    if (!token) return res.status(401).json({ error: 'Token required' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET missing' });

    try {
        const payload = jwt.verify(token, secret) as Partial<TokenPayloadV2> & { iat?: number };
        const headerTenantId = req.header(TENANT_HEADER_KEY);
        const headerTenantSlug = req.header(TENANT_SLUG_HEADER);

        const issuedAtMs = (payload.iat || 0) * 1000;
        const isLegacyToken = payload.ver !== 2 || !payload.tenantId;
        const inGrace = Date.now() - issuedAtMs <= GRACE_MS;

        if (isLegacyToken && !inGrace) {
            return res.status(401).json({ error: 'Token version expired' });
        }

        if (headerTenantId && payload.tenantId && headerTenantId !== payload.tenantId) {
            return res.status(401).json({ error: 'Tenant mismatch' });
        }

        if (headerTenantSlug && payload.tenantId && headerTenantSlug.length === 0) {
            return res.status(401).json({ error: 'Tenant mismatch' });
        }

        (req as any).tokenPayload = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
