const { rerankWithLLM } = require("./openaiService")

async function rerankChunks(query, candidates, topK = 5) {
    if (candidates.length <= topK) {
        return candidates
    }

    const ranked = await rerankWithLLM(query, candidates)
    return ranked.slice(0, topK)
}

module.exports = {
    rerankChunks,
}
