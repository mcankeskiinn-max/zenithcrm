export class TenantIsolationError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, unknown>;

    constructor(message: string, opts?: { statusCode?: number; code?: string; details?: Record<string, unknown> }) {
        super(message);
        this.name = 'TenantIsolationError';
        this.statusCode = opts?.statusCode ?? 403;
        this.code = opts?.code ?? 'TENANT_ISOLATION';
        this.details = opts?.details;
    }
}

export class TenantAccessDeniedError extends TenantIsolationError {
    constructor(message = 'Record not found or access denied', details?: Record<string, unknown>) {
        super(message, { statusCode: 404, code: 'TENANT_ACCESS_DENIED', details });
        this.name = 'TenantAccessDeniedError';
    }
}

export class TenantMismatchError extends TenantIsolationError {
    constructor(message = 'Tenant mismatch detected', details?: Record<string, unknown>) {
        super(message, { statusCode: 403, code: 'TENANT_MISMATCH', details });
        this.name = 'TenantMismatchError';
    }
}

export class TenantBypassError extends TenantIsolationError {
    constructor(message = 'Tenant bypass is not permitted', details?: Record<string, unknown>) {
        super(message, { statusCode: 403, code: 'TENANT_BYPASS_DENIED', details });
        this.name = 'TenantBypassError';
    }
}
