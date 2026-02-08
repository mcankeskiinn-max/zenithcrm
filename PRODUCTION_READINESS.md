# Production Readiness Checklist

## Required Environment Variables
- DATABASE_URL
- JWT_SECRET (64+ chars)
- JWT_REFRESH_SECRET (64+ chars)
- JWT_EXPIRES_IN (example: 15m)
- JWT_REFRESH_EXPIRES_IN (example: 30d)
- JWT_REFRESH_EXPIRES_IN_SHORT (example: 7d)
- NODE_ENV=production
- CLIENT_URL (frontend base URL)
- CORS_ORIGIN (exact frontend origin)
- SMTP_PASS (Resend API key for password reset emails)
- TRUST_PROXY (optional, set to 1 behind a single reverse proxy)
- ALLOW_INLINE_STYLES (optional, set to true if CSP inline styles are required)
- PORT (optional)

## Secrets Management
- Store secrets in Railway/Vercel/Supabase secret manager (never in repo).
- Rotate JWT secrets on schedule and after incidents.

## Logging & Monitoring
- Capture server errors (platform logs or Sentry).
- Alert on login failures, rate-limit spikes, and 5xx errors.
- Ensure no sensitive data is logged (tokens, passwords, PII).
- Sentry Issues aktif, en az bir test event gorunur.

## Backups & Recovery
- Enable scheduled Supabase backups.
- Test restore procedure (at least quarterly).

## Security Controls
- Enforce HTTPS at the platform layer.
- Keep CSP and helmet enabled in production.
- Keep CSRF protection enabled.
- Keep rate limits enabled for /api and auth endpoints.
- Tenant/branch isolation kontrolu yapildi (liste + detay endpointleri).

## Access Control
- Verify tenant + branch + role rules are configured for every admin/manager/employee.
- Confirm manager accounts have branchId assigned.

## Operational Checks
- Run server + client tests in CI on each push.
- Review Prisma migrations before deploy.
- Verify health endpoint (GET /) responds with 200.

## Release Gate
- CI: `server-tests` and `client-tests` must pass (server-tests may be skipped if secrets are missing).
- UI flow checks (Playwright) must pass (may be skipped if CRM secrets are missing).
- UI flow artifacts (summary + screenshots) are stored by CI for review.
- Security audit (npm audit high+) notlari gozden gecirildi.
- `SECURITY_REVIEW_TEMPLATE.md` dolduruldu.

## Neden Bu Kontroller?
- Kritik akislari otomatik kontrol ederek yayin oncesi hatalari yakalar.
- Testi hizlandirip gereksiz riskleri azaltir.
- Hata oldugunda ekran goruntusu + ozet sayesinde hizli teshis saglar.
- Critical flows (login/sales/customer/commission) must be validated.
- Review `RELEASE_GATE.md` checklist before production release.

## Release Checklist Review (2026-02-06)
- Lokal server testleri gecti (jest).
- Lokal client testleri gecti (vitest).
- Playwright UI smoke testi gecti (summary.json).
- Dev sunuculari dogrulama sonrasi kapatildi.
- CI durum kontrolu bu turda yapilmadi.


<!-- TENANT_AUDIT_START -->
## Son Tarama Durumu
- Tarih: 2026-02-08T21:11:01.312Z
- Sonuc: READY
- PASS: 7
- WARN: 1
- FAIL: 0
<!-- TENANT_AUDIT_END -->
