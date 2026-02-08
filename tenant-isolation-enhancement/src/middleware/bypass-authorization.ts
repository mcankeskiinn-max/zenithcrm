import type { Request, Response, NextFunction } from 'express';
import { BypassPermission } from '../types/bypass.types';
import { runWithBypass } from '../lib/tenant-bypass';
import { BypassAbuseDetector } from '../monitoring/bypass-abuse-detector';

const abuseDetector = new BypassAbuseDetector();

export const requireBypass = (permission: BypassPermission) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as any;
        const reason = req.header('x-bypass-reason') || req.body?.bypassReason;

        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const abuseAlert = await abuseDetector.checkAbuse(String(user.id), String(reason || ''));
        if (abuseAlert && abuseAlert.action === 'TEMP_BLOCK') {
            return res.status(429).json({
                error: 'Too many bypass attempts. Temporarily blocked.',
                unblockAt: new Date(Date.now() + 3600000).toISOString()
            });
        }
        if (abuseAlert) {
            // TODO: integrate notification channel
            console.warn('Bypass abuse detected', abuseAlert);
        }

        try {
            await runWithBypass(async () => Promise.resolve(), {
                permission,
                reason: String(reason || ''),
                requestedBy: user.id,
                requesterRole: user.role,
                affectedTenants: req.body?.tenantIds
            });
            return next();
        } catch (error: any) {
            return res.status(403).json({ error: error.message || 'Bypass denied' });
        }
    };
};
