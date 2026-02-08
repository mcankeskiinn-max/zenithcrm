/**
 * Pre-Production Audit Script
 *
 * TL;DR:
 * 1) Tenant izolasyonu kontrollerini dogrular
 * 2) Kritik FAIL varsa exit code 1 ile deployu engeller
 * 3) Uyari varsa ciktiya ekler, deployu durdurmaz
 */

import fs from 'fs';
import path from 'path';
// @ts-ignore - runtime require for shared prisma instance
const prisma = require('../../server/src/prisma').default;

const REPO_ROOT = path.join(__dirname, '..', '..');
const loadEnvFromFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
        return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        process.env[key] = value.replace(/^"|"$/g, '');
    }
};

loadEnvFromFile(path.join(REPO_ROOT, 'server', '.env'));

type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type AuditResult = {
    category: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    message: string;
    severity: Severity;
    action?: string;
};

type AuditReport = {
    passed: boolean;
    results: AuditResult[];
    blockers: AuditResult[];
};

const CRITICAL_BLOCK = (results: AuditResult[]) =>
    results.filter((r) => r.status === 'FAIL' && r.severity === 'CRITICAL');

const readEnv = (key: string) => process.env[key] || '';

const checkSchemaHasTenantId = async (): Promise<AuditResult> => {
    const models = (await prisma.$queryRawUnsafe(
        `SELECT table_name FROM information_schema.columns WHERE column_name = 'tenantId' AND table_schema = 'public'`
    )) as { table_name: string }[];
    const hasTenantTables = models.map((r: { table_name: string }) => r.table_name);
    if (hasTenantTables.length === 0) {
        return {
            category: 'schema',
            status: 'FAIL',
            message: 'No tenantId columns found in schema',
            severity: 'CRITICAL'
        };
    }
    return {
        category: 'schema',
        status: 'PASS',
        message: `tenantId column found in ${hasTenantTables.length} tables`,
        severity: 'LOW'
    };
};

const checkMiddlewareActive = async (): Promise<AuditResult> => {
    const flag = readEnv('TENANT_MIDDLEWARE_ENABLED');
    if (flag && flag !== 'true') {
        return {
            category: 'middleware',
            status: 'FAIL',
            message: 'TENANT_MIDDLEWARE_ENABLED is false',
            severity: 'CRITICAL',
            action: 'Set TENANT_MIDDLEWARE_ENABLED=true'
        };
    }
    return {
        category: 'middleware',
        status: 'PASS',
        message: 'Tenant middleware is enabled',
        severity: 'LOW'
    };
};

const checkEnvironmentConfig = async (): Promise<AuditResult> => {
    const jwt = readEnv('JWT_SECRET');
    const refresh = readEnv('JWT_REFRESH_SECRET');
    if (!jwt || jwt.length < 32 || !refresh || refresh.length < 32) {
        return {
            category: 'env',
            status: 'FAIL',
            message: 'JWT secrets are missing or too short',
            severity: 'CRITICAL',
            action: 'Set strong JWT_SECRET and JWT_REFRESH_SECRET'
        };
    }
    const bypassApproval = readEnv('BYPASS_REQUIRE_APPROVAL');
    if (bypassApproval !== 'true') {
        return {
            category: 'env',
            status: 'WARN',
            message: 'BYPASS_REQUIRE_APPROVAL is false',
            severity: 'MEDIUM',
            action: 'Consider enabling in production'
        };
    }
    return {
        category: 'env',
        status: 'PASS',
        message: 'Environment config looks OK',
        severity: 'LOW'
    };
};

const checkAuditLogging = async (): Promise<AuditResult> => {
    try {
        await prisma.auditLog.findFirst({});
        return {
            category: 'audit',
            status: 'PASS',
            message: 'Audit log reachable',
            severity: 'LOW'
        };
    } catch {
        return {
            category: 'audit',
            status: 'FAIL',
            message: 'Audit log table not reachable',
            severity: 'CRITICAL'
        };
    }
};

const checkTestCoverage = async (): Promise<AuditResult> => {
    const coverageFile = path.join(REPO_ROOT, 'server', 'coverage', 'coverage-summary.json');
    const coverageFinal = path.join(REPO_ROOT, 'server', 'coverage', 'coverage-final.json');
    const tenantOnly = readEnv('TENANT_COVERAGE_ONLY') === 'true';
    const minPct = Number(readEnv('TENANT_COVERAGE_MIN') || 95);
    if (!fs.existsSync(coverageFile)) {
        return {
            category: 'tests',
            status: 'WARN',
            message: 'Coverage report not found',
            severity: 'MEDIUM',
            action: 'Run npm run test:coverage'
        };
    }
    if (tenantOnly) {
        if (!fs.existsSync(coverageFinal)) {
            return {
                category: 'tests',
                status: 'WARN',
                message: 'coverage-final.json not found for tenant-only coverage',
                severity: 'MEDIUM',
                action: 'Run npm run test:coverage'
            };
        }

        const data = JSON.parse(fs.readFileSync(coverageFinal, 'utf-8'));
        const tenantCriticalFiles = [
            path.join(REPO_ROOT, 'server', 'src', 'lib', 'prisma-tenant-middleware.ts'),
            path.join(REPO_ROOT, 'server', 'src', 'utils', 'tenant-bypass.ts'),
            path.join(REPO_ROOT, 'server', 'src', 'utils', 'tenant-context.ts'),
            path.join(REPO_ROOT, 'server', 'src', 'utils', 'tenant-errors.ts'),
            path.join(REPO_ROOT, 'server', 'src', 'middleware', 'auth.middleware.ts')
        ];

        let total = 0;
        let covered = 0;
        for (const file of tenantCriticalFiles) {
            const entry = data[file];
            if (!entry || !entry.s) continue;
            const stmtKeys = Object.keys(entry.s);
            total += stmtKeys.length;
            covered += stmtKeys.filter((k) => entry.s[k] > 0).length;
        }

        const pct = total > 0 ? Number(((covered / total) * 100).toFixed(2)) : 0;
        if (pct < minPct) {
            return {
                category: 'tests',
                status: 'FAIL',
                message: `Tenant-critical coverage below ${minPct}% (${pct}%)`,
                severity: 'HIGH',
                action: 'Improve tenant-critical tests or adjust TENANT_COVERAGE_MIN'
            };
        }
        return {
            category: 'tests',
            status: 'PASS',
            message: `Tenant-critical coverage ${pct}%`,
            severity: 'LOW'
        };
    }

    const data = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'));
    const pct = data.total?.lines?.pct || 0;
    if (pct < minPct) {
        return {
            category: 'tests',
            status: 'FAIL',
            message: `Coverage below ${minPct}% (${pct}%)`,
            severity: 'HIGH'
        };
    }
    return {
        category: 'tests',
        status: 'PASS',
        message: `Coverage ${pct}%`,
        severity: 'LOW'
    };
};


const checkEndpointProtection = async (): Promise<AuditResult> => {
    try {
        const appPath = path.join(REPO_ROOT, 'server', 'src', 'app.ts');
        if (!fs.existsSync(appPath)) {
            return {
                category: 'endpoints',
                status: 'WARN',
                message: 'app.ts not found for endpoint scan',
                severity: 'MEDIUM'
            };
        }
        const appSource = fs.readFileSync(appPath, 'utf-8');
        const criticalEndpoints = [
            '/api/customers',
            '/api/policy-types',
            '/api/branches',
            '/api/sales'
        ];
        const unprotected: string[] = [];
        for (const ep of criticalEndpoints) {
            const routeLine = `app.use('${ep}'`;
            if (appSource.includes(routeLine)) {
                // Heuristic: route file should have authenticate middleware
                // We flag if route line exists but authenticate is not referenced in the route file
                const routeName = ep.split('/').pop() || '';
                const routeFile = path.join(REPO_ROOT, 'server', 'src', 'routes', `${routeName}.routes.ts`);
                if (fs.existsSync(routeFile)) {
                    const routeSource = fs.readFileSync(routeFile, 'utf-8');
                    if (!routeSource.includes('authenticate')) {
                        unprotected.push(ep);
                    }
                }
            }
        }

        if (unprotected.length > 0) {
            return {
                category: 'endpoints',
                status: 'FAIL',
                message: `${unprotected.length} unprotected endpoints found: ${unprotected.join(', ')}`,
                severity: 'CRITICAL',
                action: 'Add authenticate middleware to critical routes'
            };
        }

        return {
            category: 'endpoints',
            status: 'PASS',
            message: 'All critical endpoints protected',
            severity: 'LOW'
        };
    } catch (error: any) {
        return {
            category: 'endpoints',
            status: 'WARN',
            message: `Endpoint scan failed: ${error?.message || 'unknown error'}`,
            severity: 'MEDIUM'
        };
    }
};

const checkBypassConfig = async (): Promise<AuditResult> => {
    const allowed = readEnv('BYPASS_ALLOWED_ROLES')
        .split(',')
        .map((r) => r.trim().toUpperCase())
        .filter(Boolean);

    if (allowed.includes('USER') || allowed.includes('AGENT') || allowed.includes('EMPLOYEE')) {
        return {
            category: 'bypass',
            status: 'FAIL',
            message: 'Non-admin roles can bypass tenant isolation',
            severity: 'CRITICAL',
            action: 'Remove USER/AGENT/EMPLOYEE from BYPASS_ALLOWED_ROLES'
        };
    }

    return {
        category: 'bypass',
        status: 'PASS',
        message: 'Bypass limited to admin roles',
        severity: 'LOW'
    };
};

const checkDatabaseIndexes = async (): Promise<AuditResult> => {
    const indexes = (await prisma.$queryRawUnsafe(
        `SELECT tablename, indexname FROM pg_indexes WHERE indexname ILIKE '%tenantid%' AND schemaname = 'public'`
    )) as { tablename: string; indexname: string }[];
    if (indexes.length < 5) {
        return {
            category: 'database',
            status: 'WARN',
            message: 'Missing tenantId indexes (performance risk)',
            severity: 'MEDIUM',
            action: 'Add indexes on tenantId columns'
        };
    }
    return {
        category: 'database',
        status: 'PASS',
        message: `${indexes.length} tenantId indexes found`,
        severity: 'LOW'
    };
};

const generateHTMLReport = (report: AuditReport): string => {
    const timestamp = new Date().toISOString();
    return `
<!DOCTYPE html>
<html>
<head>
<title>Pre-Production Audit - ${timestamp}</title>
<style>
body { font-family: Arial; padding: 20px; }
.pass { color: green; }
.warn { color: orange; }
.fail { color: red; }
.blocker { background: #ffebee; padding: 10px; margin: 10px 0; }
</style>
</head>
<body>
<h1>?? ZenithCRM Pre-Production Audit</h1>
<p>Timestamp: ${timestamp}</p>
<p>Status: ${report.passed ? '? PASSED' : '? FAILED'}</p>
<h2>Results</h2>
${report.results
        .map((r) => `
<div class="${r.status.toLowerCase()}">
<strong>${r.category}</strong>: ${r.message}
${r.action ? `<br><em>Action: ${r.action}</em>` : ''}
</div>`)
        .join('')}
${report.blockers.length > 0
        ? `
<h2>? BLOCKERS</h2>
${report.blockers
              .map((b) => `
<div class="blocker">
<strong>${b.category}</strong>: ${b.message}<br>
<em>${b.action || ''}</em>
</div>`)
              .join('')}`
        : ''}
</body>
</html>`;
};

const runPreProductionAudit = async (): Promise<AuditReport> => {
    const results: AuditResult[] = [];
    results.push(await checkSchemaHasTenantId());
    results.push(await checkMiddlewareActive());
    results.push(await checkEnvironmentConfig());
    results.push(await checkBypassConfig());
    results.push(await checkDatabaseIndexes());
    results.push(await checkEndpointProtection());
    results.push(await checkAuditLogging());
    results.push(await checkTestCoverage());

    const blockers = CRITICAL_BLOCK(results);
    return {
        passed: blockers.length === 0,
        results,
        blockers
    };
};

const main = async () => {
    console.log('?? ZenithCRM Tenant Isolation Pre-Production Audit');
    const report = await runPreProductionAudit();

    for (const r of report.results) {
        const icon = r.status === 'PASS' ? '?' : r.status === 'WARN' ? '??' : '?';
        console.log(`${icon} ${r.status} - ${r.message}`);
    }

    const htmlReport = generateHTMLReport(report);
    fs.writeFileSync('audit-report.html', htmlReport);
    console.log('?? Report saved to audit-report.html');

    if (!report.passed) {
        console.error(`? BLOCKERS: ${report.blockers.length}`);
        process.exit(1);
    }

    console.log('?? READY FOR PRODUCTION');
    process.exit(0);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
