import { Request, Response, NextFunction } from 'express';

export const METRIC_KEYS = {
    TENANT_MISMATCH: 'tenant_mismatch',
    BYPASS_USED: 'tenant_bypass_used',
    CROSS_TENANT_ATTEMPT: 'cross_tenant_attempt',
    UNAUTHORIZED: 'unauthorized'
} as const;

const counters: Record<string, number> = {};

export const incrementMetric = (key: string) => {
    counters[key] = (counters[key] || 0) + 1;
};

export const metricsMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    (req as any).metrics = counters;
    next();
};

export const getMetricsSnapshot = () => ({ ...counters });
