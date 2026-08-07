export type Citation = {
    citationNumber: number
    id: number
    chunkIndex: number | null
    chunkText: string
    metadata?: {
        file_name?: string
        file_type?: string
        chunk_index?: number
        start_char?: number
        end_char?: number
    }
    vectorScore?: number | null
    bm25Score?: number | null
    finalScore?: number | null
}
