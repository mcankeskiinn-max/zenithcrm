# Threat Model One-Pager (ZenithCRM)

## Scope
Public internet CRM with multi-tenant + branch data, cookie auth, Postgres, and file uploads.

## Trust Boundaries
- Browser -> API (public internet)
- API -> Postgres (internal)
- API -> File system (uploads)

## Critical Assets
- Tenant and branch data
- User credentials and sessions
- Customer records, sales, commissions
- Documents (uploads)
- Audit logs

## Top Risks
1. Cross-tenant or cross-branch data access by ID tampering.
2. Account takeover from stolen session or credential stuffing.
3. Bulk data exposure via reports or analytics.
4. File upload abuse (malware or storage exhaustion).
5. CSRF on state-changing endpoints.

## Current Controls
- Auth middleware with tenant context.
- CSRF protection for cookie auth.
- CORS allowlist and CSP/helmet.
- Rate limits in production.
- Upload size/type limits.
- Sentry error monitoring with alerts.

## Known Gaps / Watchouts
- Consistent tenant and branch filters across all controllers.
- Role checks on report/analytics/export endpoints.
- Static or predictable file paths (upload access).
- Alerting on repeated auth failures and report exports.

## Security Checklist For New Endpoints
- [ ] Auth required and role checks applied.
- [ ] tenantId and branchId filters enforced in queries.
- [ ] Input validation on all required fields.
- [ ] No PII or tokens in logs.
- [ ] Rate limit considered for high-risk endpoints.

## Test Priorities
- Cross-tenant read/write denied.
- Role-based access denied for non-admin routes.
- Validation failures return 400.

## Detection Priorities
- Alerts on new error issues and issue spikes.
- Monitor failed logins and rate limit triggers.
