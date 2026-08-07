import type { Citation } from "./citations"

export type Message = {
    id: number
    user_id: number
    document_id: number
    role: "user" | "assistant"
    message: string
    created_at: string
    citations?: Citation[] | string | null
}
