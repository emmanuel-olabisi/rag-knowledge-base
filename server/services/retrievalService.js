const pool = require("../db/db")
const cache = require("./cacheService")
const { generateEmbedding } = require("./embeddingService")

const RRF_K = 60
const VECTOR_CANDIDATES = 20
const BM25_CANDIDATES = 20

function reciprocalRankFusion(rankedLists) {
    const scores = new Map()

    for (const list of rankedLists) {
        list.forEach((item, index) => {
            const current = scores.get(item.id) || {
                ...item,
                finalScore: 0,
            }
            current.finalScore += 1 / (RRF_K + index + 1)
            scores.set(item.id, current)
        })
    }

    return Array.from(scores.values()).sort((a, b) => b.finalScore - a.finalScore)
}

async function vectorSearch({ documentId, userId, embedding, limit = VECTOR_CANDIDATES }) {
    const result = await pool.query(
        `SELECT
            dc.id,
            dc.chunk_index,
            dc.chunk_text,
            dc.metadata,
            (dc.embedding <=> $3) AS vector_distance
         FROM document_chunks dc
         JOIN documents d ON dc.document_id = d.id
         WHERE dc.document_id = $1
           AND d.user_id = $2
         ORDER BY dc.embedding <=> $3
         LIMIT $4`,
        [documentId, userId, JSON.stringify(embedding), limit]
    )

    return result.rows.map((row, index) => ({
        id: row.id,
        chunkIndex: row.chunk_index,
        chunkText: row.chunk_text,
        metadata: row.metadata || {},
        vectorScore: 1 - Number(row.vector_distance),
        vectorRank: index,
    }))
}

async function keywordSearch({ documentId, userId, query, limit = BM25_CANDIDATES }) {
    const result = await pool.query(
        `SELECT
            dc.id,
            dc.chunk_index,
            dc.chunk_text,
            dc.metadata,
            ts_rank(dc.search_vector, plainto_tsquery('english', $3)) AS bm25_score
         FROM document_chunks dc
         JOIN documents d ON dc.document_id = d.id
         WHERE dc.document_id = $1
           AND d.user_id = $2
           AND dc.search_vector @@ plainto_tsquery('english', $3)
         ORDER BY bm25_score DESC
         LIMIT $4`,
        [documentId, userId, query, limit]
    )

    return result.rows.map((row, index) => ({
        id: row.id,
        chunkIndex: row.chunk_index,
        chunkText: row.chunk_text,
        metadata: row.metadata || {},
        bm25Score: Number(row.bm25_score),
        bm25Rank: index,
    }))
}

async function retrieveRelevantChunks({
    documentId,
    userId,
    query,
    rewrittenQuery,
    metadataFilter = {},
}) {
    const cacheKey = `retrieval:${documentId}:${rewrittenQuery}:${JSON.stringify(metadataFilter)}`
    const cached = cache.get(cacheKey)
    if (cached) {
        return { chunks: cached, cacheHit: true }
    }

    const embedding = await generateEmbedding(rewrittenQuery)

    const [vectorResults, keywordResults] = await Promise.all([
        vectorSearch({ documentId, userId, embedding, limit: VECTOR_CANDIDATES }),
        keywordSearch({ documentId, userId, query: rewrittenQuery, limit: BM25_CANDIDATES }),
    ])

    let fused = reciprocalRankFusion([vectorResults, keywordResults])

    if (metadataFilter.chunkIndex !== undefined) {
        fused = fused.filter((chunk) => chunk.chunkIndex === metadataFilter.chunkIndex)
    }

    if (metadataFilter.fileType) {
        fused = fused.filter(
            (chunk) => chunk.metadata?.file_type === metadataFilter.fileType
        )
    }

    cache.set(cacheKey, fused, 1000 * 60 * 10)

    return { chunks: fused, cacheHit: false }
}

function formatContextWithCitations(chunks) {
    return chunks.map((chunk, index) => ({
        citationNumber: index + 1,
        id: chunk.id,
        chunkIndex: chunk.chunkIndex,
        chunkText: chunk.chunkText,
        metadata: chunk.metadata,
        vectorScore: chunk.vectorScore ?? null,
        bm25Score: chunk.bm25Score ?? null,
        finalScore: chunk.finalScore ?? null,
    }))
}

function buildNumberedContext(chunks) {
    return chunks
        .map((chunk, index) => `[${index + 1}] ${chunk.chunkText}`)
        .join("\n\n")
}

module.exports = {
    retrieveRelevantChunks,
    formatContextWithCitations,
    buildNumberedContext,
}
