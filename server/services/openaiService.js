const Openai = require("openai")

const openai = new Openai({
    apiKey: process.env.OPENAI_API_KEY,
})

async function generateResponse(messages) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.2,
    })

    return completion.choices[0].message.content
}

async function rewriteQueryWithContext(query, recentMessages) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content:
                    "Rewrite the latest user question into a standalone search query using prior conversation context. Return only the rewritten query.",
            },
            ...recentMessages,
            { role: "user", content: query },
        ],
    })

    return completion.choices[0].message.content.trim() || query
}

async function rerankWithLLM(query, candidates) {
    const formattedCandidates = candidates
        .map(
            (candidate, index) =>
                `${index + 1}. id=${candidate.id}\n${candidate.chunkText.slice(0, 500)}`
        )
        .join("\n\n")

    const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content:
                    "Rank the passages by relevance to the query. Respond with JSON: {\"rankedIds\": [id1, id2, ...]} ordered best to worst.",
            },
            {
                role: "user",
                content: `Query: ${query}\n\nPassages:\n${formattedCandidates}`,
            },
        ],
        response_format: { type: "json_object" },
    })

    try {
        const parsed = JSON.parse(completion.choices[0].message.content)
        const orderedIds = parsed.rankedIds || parsed.ids || []

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return candidates
        }

        const lookup = new Map(candidates.map((candidate) => [candidate.id, candidate]))
        const ranked = orderedIds
            .map((id) => lookup.get(Number(id)))
            .filter(Boolean)

        const remaining = candidates.filter(
            (candidate) => !ranked.some((item) => item.id === candidate.id)
        )

        return [...ranked, ...remaining]
    } catch {
        return candidates
    }
}

async function summarizeConversation(messages) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0,
        messages: [
            {
                role: "system",
                content:
                    "Summarize this document conversation in 4-6 bullet points. Preserve key facts, entities, and unresolved questions.",
            },
            {
                role: "user",
                content: messages
                    .map((message) => `${message.role}: ${message.content}`)
                    .join("\n"),
            },
        ],
    })

    return completion.choices[0].message.content.trim()
}

module.exports = {
    generateResponse,
    rewriteQueryWithContext,
    rerankWithLLM,
    summarizeConversation,
}
