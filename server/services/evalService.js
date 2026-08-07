const pool = require("../db/db")
const { stats: cacheStats } = require("./cacheService")

async function getRetrievalMetrics(userId) {
    const totals = await pool.query(
        `SELECT
            COUNT(*)::int AS total_queries,
            COALESCE(AVG(latency_ms), 0)::float AS avg_latency_ms,
            COALESCE(AVG(CASE WHEN cache_hit THEN 1 ELSE 0 END), 0)::float AS cache_hit_rate,
            COALESCE(AVG(COALESCE(array_length(retrieved_chunk_ids, 1), 0)), 0)::float AS avg_chunks_retrieved
         FROM retrieval_logs
         WHERE user_id = $1`,
        [userId]
    )

    const recent = await pool.query(
        `SELECT query, rewritten_query, latency_ms, cache_hit, created_at
         FROM retrieval_logs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [userId]
    )

    return {
        totals: totals.rows[0],
        recentQueries: recent.rows,
        cache: cacheStats(),
    }
}

async function logRetrieval({
    documentId,
    userId,
    query,
    rewrittenQuery,
    chunks,
    latencyMs,
    cacheHit,
}) {
    await pool.query(
        `INSERT INTO retrieval_logs (
            document_id, user_id, query, rewritten_query,
            retrieved_chunk_ids, vector_scores, bm25_scores, final_scores,
            latency_ms, cache_hit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            documentId,
            userId,
            query,
            rewrittenQuery,
            chunks.map((chunk) => chunk.id),
            chunks.map((chunk) => chunk.vectorScore ?? null),
            chunks.map((chunk) => chunk.bm25Score ?? null),
            chunks.map((chunk) => chunk.finalScore ?? null),
            latencyMs,
            cacheHit,
        ]
    )
}

module.exports = {
    getRetrievalMetrics,
    logRetrieval,
}
