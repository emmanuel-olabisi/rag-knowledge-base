require("dotenv").config()

const express = require("express")
const multer = require("multer")
const pool = require("../db/db")
const jwt = require("jsonwebtoken")
const { extractText } = require("../services/documentService")
const { generateResponse } = require("../services/openaiService")
const { chunkText } = require("../services/chunkService")
const { generateEmbedding } = require("../services/embeddingService")
const { rewriteQuery } = require("../services/queryRewriteService")
const {
    retrieveRelevantChunks,
    formatContextWithCitations,
    buildNumberedContext,
} = require("../services/retrievalService")
const { rerankChunks } = require("../services/rerankService")
const {
    getConversationContext,
    buildPromptMessages,
} = require("../services/memoryService")
const { logRetrieval } = require("../services/evalService")
const fs = require("fs/promises")

const upload = multer({
    dest: "uploads/",
})

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({
            success: false,
        })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
}

async function verifyDocumentOwnership(documentId, userId) {
    const result = await pool.query(
        "SELECT id FROM documents WHERE id = $1 AND user_id = $2",
        [documentId, userId]
    )

    return result.rows.length > 0
}

router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
    try {
        const user_id = req.user.userID
        const file_name = req.file.originalname
        const file_path = req.file.path
        const fileExtension = file_name.split(".").pop()?.toLowerCase() || "unknown"

        const response = await pool.query(
            "INSERT INTO documents(user_id, file_name, file_path) VALUES($1,$2,$3) RETURNING *",
            [user_id, file_name, file_path]
        )

        const extractedText = await extractText(file_path)
        const chunks = chunkText(extractedText)

        for (const chunk of chunks) {
            const textEmbedding = await generateEmbedding(chunk.text)
            const metadata = {
                file_name,
                file_type: fileExtension,
                chunk_index: chunk.chunkIndex,
                start_char: chunk.startChar,
                end_char: chunk.endChar,
            }

            await pool.query(
                `INSERT INTO document_chunks(
                    document_id, chunk_text, embedding,
                    chunk_index, start_char, end_char, metadata, search_vector
                ) VALUES($1, $2, $3, $4, $5, $6, $7, to_tsvector('english', $2))`,
                [
                    response.rows[0].id,
                    chunk.text,
                    JSON.stringify(textEmbedding),
                    chunk.chunkIndex,
                    chunk.startChar,
                    chunk.endChar,
                    JSON.stringify(metadata),
                ]
            )
        }

        res.json({
            success: true,
            data: response.rows[0],
        })
    } catch (error) {
        console.log("error in upload: ", error)
        res.json({
            success: false,
            message: "upload failed",
        })
    } finally {
        if (req.file) {
            try {
                await fs.unlink(req.file.path)
            } catch (err) {
                console.error("Failed to delete temporary upload:", err)
            }
        }
    }
})

router.get("/", authenticate, async (req, res) => {
    try {
        const response = await pool.query(
            "SELECT * FROM documents WHERE user_id = $1 ORDER BY uploaded_at DESC",
            [req.user.userID]
        )

        res.json({
            success: true,
            data: response.rows,
        })
    } catch (error) {
        res.status(400).json({
            success: false,
        })
    }
})

router.put("/:id/rename", authenticate, async (req, res) => {
    try {
        await pool.query(
            `UPDATE documents
             SET file_name = $1
             WHERE id = $2 AND user_id = $3`,
            [req.body.documentName, req.params.id, req.user.userID]
        )

        res.json({
            success: true,
        })
    } catch (error) {
        res.json({
            success: false,
            message: "server error",
        })
    }
})

router.delete("/:id", authenticate, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM documents WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.userID]
        )

        res.json({
            success: true,
        })
    } catch (error) {
        res.json({
            success: false,
        })
    }
})

router.get("/:id/conversation", authenticate, async (req, res) => {
    try {
        const documentId = Number(req.params.id)
        const userId = req.user.userID

        const ownsDocument = await verifyDocumentOwnership(documentId, userId)
        if (!ownsDocument) {
            return res.status(403).json({
                success: false,
                message: "document not found",
            })
        }

        const result = await pool.query(
            "SELECT * FROM conversations WHERE document_id=$1 AND user_id=$2 ORDER BY created_at ASC",
            [documentId, userId]
        )

        res.json({
            success: true,
            data: result.rows,
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "server error",
        })
    }
})

router.post("/:id/conversation", authenticate, async (req, res) => {
    const startedAt = Date.now()

    try {
        const documentId = Number(req.params.id)
        const userId = req.user.userID
        const userQuery = req.body.content

        const ownsDocument = await verifyDocumentOwnership(documentId, userId)
        if (!ownsDocument) {
            return res.status(403).json({
                success: false,
                message: "document not found",
            })
        }

        const result = await pool.query(
            "INSERT INTO conversations(user_id, document_id, role, message) VALUES($1,$2,$3,$4) RETURNING *",
            [userId, documentId, req.body.role, userQuery]
        )

        const savedUserMessage = result.rows[0]
        const { summary, recentMessages } = await getConversationContext(
            documentId,
            userId
        )

        const rewrittenQuery = await rewriteQuery(userQuery, recentMessages)

        const { chunks: candidateChunks, cacheHit } = await retrieveRelevantChunks({
            documentId,
            userId,
            query: userQuery,
            rewrittenQuery,
            metadataFilter: req.body.metadataFilter || {},
        })

        const rankedChunks = await rerankChunks(rewrittenQuery, candidateChunks, 5)
        const citations = formatContextWithCitations(rankedChunks)
        const numberedContext = buildNumberedContext(rankedChunks)

        const messages = buildPromptMessages({
            summary,
            recentMessages,
            numberedContext,
            currentQuery: userQuery,
        })

        const assistantResponse = await generateResponse(messages)

        const assistantResult = await pool.query(
            `INSERT INTO conversations(user_id, document_id, role, message, citations)
             VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [
                userId,
                documentId,
                "assistant",
                assistantResponse,
                JSON.stringify(citations),
            ]
        )

        const savedAssistantMessage = assistantResult.rows[0]

        await logRetrieval({
            documentId,
            userId,
            query: userQuery,
            rewrittenQuery,
            chunks: rankedChunks,
            latencyMs: Date.now() - startedAt,
            cacheHit,
        })

        res.json({
            success: true,
            userMessage: savedUserMessage,
            assistantMessage: savedAssistantMessage,
            citations,
            rewrittenQuery,
            retrieval: {
                cacheHit,
                candidateCount: candidateChunks.length,
                latencyMs: Date.now() - startedAt,
            },
        })
    } catch (error) {
        console.log("server error: ", error)
        res.status(400).json({
            success: false,
            message: "server error",
        })
    }
})

module.exports = router
