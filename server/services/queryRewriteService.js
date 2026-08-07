const { rewriteQueryWithContext } = require("./openaiService")

async function rewriteQuery(query, recentMessages) {
    const trimmed = query.trim()
    if (!trimmed) return trimmed

    const priorUserTurns = recentMessages
        .filter((message) => message.role === "user")
        .slice(-3)
        .map((message) => message.content)

    if (priorUserTurns.length === 0) {
        return trimmed
    }

    return rewriteQueryWithContext(trimmed, recentMessages.slice(-6))
}

module.exports = {
    rewriteQuery,
}
