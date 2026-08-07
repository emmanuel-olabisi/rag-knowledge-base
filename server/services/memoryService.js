const pool = require("../db/db")
const { summarizeConversation } = require("./openaiService")

const RECENT_MESSAGE_LIMIT = 8

async function getConversationContext(documentId, userId) {
    const summaryResult = await pool.query(
        `SELECT summary FROM conversation_summaries
         WHERE document_id = $1 AND user_id = $2`,
        [documentId, userId]
    )

    const messagesResult = await pool.query(
        `SELECT role, message FROM conversations
         WHERE document_id = $1 AND user_id = $2
         ORDER BY created_at ASC`,
        [documentId, userId]
    )

    const allMessages = messagesResult.rows.map((row) => ({
        role: row.role,
        content: row.message,
    }))

    const recentMessages = allMessages.slice(-RECENT_MESSAGE_LIMIT)
    const summary = summaryResult.rows[0]?.summary || ""

    if (allMessages.length > RECENT_MESSAGE_LIMIT + 4) {
        updateSummary(documentId, userId, allMessages).catch((err) => {
            console.log("summary update failed:", err.message)
        })
    }

    return { summary, recentMessages, allMessages }
}

async function updateSummary(documentId, userId, messages) {
    const summary = await summarizeConversation(messages)
    await pool.query(
        `INSERT INTO conversation_summaries (document_id, user_id, summary, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (document_id, user_id)
         DO UPDATE SET summary = EXCLUDED.summary, updated_at = NOW()`,
        [documentId, userId, summary]
    )
}

function buildPromptMessages({ summary, recentMessages, numberedContext, currentQuery }) {
    const systemParts = [
        "You are a precise document assistant. Answer only using the numbered source excerpts below.",
        "When you use information from a source, cite it inline like [1] or [2].",
        "If the answer is not in the sources, say you could not find it in the document.",
    ]

    if (summary) {
        systemParts.push(`Conversation summary so far:\n${summary}`)
    }

    systemParts.push(`Sources:\n${numberedContext}`)

    return [
        { role: "system", content: systemParts.join("\n\n") },
        ...recentMessages.slice(0, -1),
        { role: "user", content: currentQuery },
    ]
}

module.exports = {
    getConversationContext,
    buildPromptMessages,
    RECENT_MESSAGE_LIMIT,
}
