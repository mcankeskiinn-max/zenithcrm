# Security Review Template

Release: <!-- e.g. 2026-02-07 / v2.7 -->
Reviewer: <!-- name -->
Date: <!-- YYYY-MM-DD -->

## Scope
- Backend endpoints touched:
- Frontend pages/components touched:
- Data model changes:

## Checklist (Must Pass)
- [ ] Auth: endpoints require authentication where needed
- [ ] AuthZ: role/tenant/branch checks exist server-side
- [ ] Validation: required fields validated server-side
- [ ] CSRF: token required for state-changing requests
- [ ] CORS: allowlist only, no wildcard with credentials
- [ ] File upload: allowlist, size limits, safe storage
- [ ] Logs: no secrets/PII in logs
- [ ] Rate limit: enabled on auth + heavy endpoints
- [ ] Migrations: reviewed and applied

## Findings
List any issues found, severity, and fix plan.

## Sign-off
- [ ] Approved for release
