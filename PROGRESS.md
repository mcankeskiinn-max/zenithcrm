# Project Progress Log

## 2026-02-05
- Started stabilization and security hardening workflow.
- Goal: fix failing tests, triage bugs, then push to GitHub.
- Next: configure test database for server tests.
- Added server/.env.test with provided Supabase DATABASE_URL for test runs (not for git).
- Fixed test env loading to prefer server/.env.test and fallback to .env (tests/setup.ts).
- Added JWT secrets to server/.env.test to unblock auth token creation in tests.
- Sanitized auth login logging to avoid leaking sensitive password data.
- Removed unreachable response in resetPassword handler.
- Added .env.test to .gitignore to prevent committing secrets.
- Added response alias token=accessToken for login to satisfy auth tests and preserve backward compatibility.
- Updated audit test to expect { logs, pagination } response shape.
- Hardened CORS origin checks to exact-match normalized origins (removed startsWith to prevent origin spoofing).
- Server tests now pass with runInBand using .env.test.
- Fixed TypeScript narrowing for allowedOrigins filtering after CORS hardening.
