# Security Hardening Checklist

## Secrets & Configuration
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (64+ chars).
- Never commit `.env` files; use secrets manager in production.
- Set `NODE_ENV=production` in production.
- Configure `CORS_ORIGIN` and `CLIENT_URL` to the exact frontend URL.
- Ensure `TRUST_PROXY` matches the real proxy chain (avoid `true` unless you know what you’re doing).
- Document all production secrets in `PRODUCTION_READINESS.md`.

## Auth & Session
- Auth uses httpOnly cookies with `Secure` + `SameSite=None` in production.
- Enable CSRF protection (already enforced via `X-CSRF-Token`).
- Rotate refresh tokens on every refresh.
- Revoke refresh tokens on logout.
- Enforce server-side authorization for every sensitive endpoint (UI checks are not security).

## Transport & Headers
- Enforce HTTPS at the platform level (Vercel/Netlify/Render/Railway).
- Keep `helmet` enabled for secure headers.
- Verify CSP in production responses (no broad `unsafe-*` defaults unless documented).

## Rate Limiting & Abuse Prevention
- Production rate limits enabled for `/api/*` and `/api/auth/login`.
- Consider stricter login rate limits if abuse is observed.
- Log repeated auth failures (do not log passwords/tokens).

## Data Safety
- Apply database backups (Supabase scheduled backups).
- Ensure Prisma migrations are reviewed before deploy.
- Verify multi-tenant filters exist on every list/detail endpoint.
- Ensure unique constraints are tenant-scoped (policy numbers, emails, etc.).

## Logging & Monitoring
- Avoid logging sensitive data (passwords, tokens, PII).
- Add error monitoring (Sentry or platform logs) for production.
- Add alerting for spikes in 4xx/5xx and rate-limit events.

## Dependencies
- Run `npm audit` regularly and address high severity issues.
- Keep Node and dependencies updated.
- CI should warn on audit findings (high+).

## CI/CD
- Use GitHub Actions with secrets for tests.
- Block deploy on failing tests.
- Run security checklist review before release.

## Sign-off
- [ ] Security review completed for this release.
- [ ] Findings recorded in `SECURITY_REVIEW_TEMPLATE.md` (or linked).
