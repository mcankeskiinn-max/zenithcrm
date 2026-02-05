# Security Hardening Checklist

## Secrets & Configuration
- Use strong, unique values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (64+ chars).
- Never commit `.env` files; use secrets manager in production.
- Set `NODE_ENV=production` in production.
- Configure `CORS_ORIGIN` and `CLIENT_URL` to the exact frontend URL.

## Auth & Session
- Auth uses httpOnly cookies with `Secure` + `SameSite=None` in production.
- Enable CSRF protection (already enforced via `X-CSRF-Token`).
- Rotate refresh tokens on every refresh.
- Revoke refresh tokens on logout.

## Transport & Headers
- Enforce HTTPS at the platform level (Vercel/Netlify/Render/Railway).
- Keep `helmet` enabled for secure headers.

## Rate Limiting & Abuse Prevention
- Production rate limits enabled for `/api/*` and `/api/auth/login`.
- Consider stricter login rate limits if abuse is observed.

## Data Safety
- Apply database backups (Supabase scheduled backups).
- Ensure Prisma migrations are reviewed before deploy.

## Logging & Monitoring
- Avoid logging sensitive data (passwords, tokens, PII).
- Add error monitoring (Sentry or platform logs) for production.

## Dependencies
- Run `npm audit` regularly and address high severity issues.
- Keep Node and dependencies updated.

## CI/CD
- Use GitHub Actions with secrets for tests.
- Block deploy on failing tests.
