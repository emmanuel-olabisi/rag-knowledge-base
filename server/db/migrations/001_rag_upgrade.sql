-- Production RAG schema upgrade
-- Run once against your PostgreSQL database:
-- psql $DATABASE_URL -f server/db/migrations/001_rag_upgrade.sql

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE document_chunks
    ADD COLUMN IF NOT EXISTS chunk_index INTEGER,
    ADD COLUMN IF NOT EXISTS start_char INTEGER,
    ADD COLUMN IF NOT EXISTS end_char INTEGER,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE document_chunks
SET search_vector = to_tsvector('english', chunk_text)
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_document_chunks_search
    ON document_chunks USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id
    ON document_chunks (document_id);

ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS conversation_summaries (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (document_id, user_id)
);

CREATE TABLE IF NOT EXISTS retrieval_logs (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    rewritten_query TEXT,
    retrieved_chunk_ids INTEGER[],
    vector_scores DOUBLE PRECISION[],
    bm25_scores DOUBLE PRECISION[],
    final_scores DOUBLE PRECISION[],
    latency_ms INTEGER,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retrieval_logs_user_id
    ON retrieval_logs (user_id, created_at DESC);
