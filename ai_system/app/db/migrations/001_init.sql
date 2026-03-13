-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number TEXT NOT NULL UNIQUE,
    policy_type TEXT,
    limit_amount NUMERIC,
    coverage_summary TEXT,
    document_gcs_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
    claim_number TEXT NOT NULL UNIQUE,
    incident_date DATE,
    status TEXT,
    description TEXT,
    image_gcs_paths TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document embeddings table
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    gcs_path TEXT,
    content TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_source ON document_embeddings (source_type, source_id);

-- Choose one index strategy: HNSW or IVFFLAT
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw
ON document_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Optional IVFFLAT alternative (commented):
-- CREATE INDEX IF NOT EXISTS idx_document_embeddings_ivfflat
-- ON document_embeddings
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);
