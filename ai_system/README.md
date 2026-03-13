# ZenithCRM AI System (FastAPI)

## Run
1. Set env vars:
   - `DATABASE_URL`
   - `GCS_BUCKET`
   - `GEMINI_API_KEY`
   - `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON path for signed URLs)
2. Apply migration `app/db/migrations/001_init.sql`
3. Start:
   - `uvicorn app.main:app --reload`

## Pub/Sub Pipeline
Configure a GCS finalize trigger to push events to:
`POST /api/pipeline/gcs`
