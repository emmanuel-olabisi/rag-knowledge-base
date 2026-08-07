function chunkText(text, chunkSize = 1000, overlap = 150) {
    const chunks = []

    if (!text) {
        return chunks
    }

    let index = 0
    for (let start = 0; start < text.length; start += chunkSize - overlap) {
        const end = Math.min(start + chunkSize, text.length)
        const chunkTextValue = text.slice(start, end)

        chunks.push({
            text: chunkTextValue,
            chunkIndex: index,
            startChar: start,
            endChar: end,
        })

        index += 1

        if (end >= text.length) {
            break
        }
    }

    return chunks
}

module.exports = {
    chunkText,
}
