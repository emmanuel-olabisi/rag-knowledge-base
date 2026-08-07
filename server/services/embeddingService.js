const crypto = require("crypto")
const cache = require("./cacheService")
const Openai = require("openai")

const client = new Openai({
    apiKey: process.env.OPENAI_API_KEY,
})

function hashText(text) {
    return crypto.createHash("sha256").update(text).digest("hex")
}

async function generateEmbedding(text) {
    const cacheKey = `embedding:${hashText(text)}`
    const cached = cache.get(cacheKey)
    if (cached) {
        return cached
    }

    const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    })

    const embedding = response.data[0].embedding
    cache.set(cacheKey, embedding, 1000 * 60 * 60 * 24)

    return embedding
}

module.exports = {
    generateEmbedding,
}
