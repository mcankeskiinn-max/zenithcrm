# Environment Setup (Local)

This is a single-page checklist for local setup. Use the unified file below and copy values into the service-specific `.env` files.

## 1. Unified template
- `zenithcrm/.env.local.example`

## 2. Where each value goes

Backend (`zenithcrm/server/.env`)
- `DATABASE_URL`, `DIRECT_URL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN_SHORT`
- `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `CLIENT_URL`
- `GOOGLE_AI_API_KEY`
- `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`

Frontend (`zenithcrm/client/.env`)
- `VITE_API_URL`

AI system (`zenithcrm/ai_system/.env`)
- `DATABASE_URL`
- `GCS_BUCKET`
- `GEMINI_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GEMINI_API_BASE`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_FLASH_MODEL`
- `EMBEDDING_DIMENSION`, `MAX_CHUNK_CHARS`, `MAX_CONTEXT_CHUNKS`

## 3. Required secrets
- `JWT_SECRET` and `JWT_REFRESH_SECRET` (backend auth)
- `GOOGLE_AI_API_KEY` (support bot)
- `GEMINI_API_KEY` (embeddings + assistant)
- `GOOGLE_APPLICATION_CREDENTIALS` (GCS signed URLs)

## 4. Local database
We use local Postgres on `5433` to avoid conflicts.
```
DATABASE_URL=postgresql://sigorta_admin:sigorta_2024_secure_pass@localhost:5433/sigorta_crm?schema=public
```
