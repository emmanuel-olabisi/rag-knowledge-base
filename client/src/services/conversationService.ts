import type { Message } from "@/types/message"
import type { Citation } from "@/types/citations"

const API_URL = import.meta.env.VITE_API_URL

function getToken() {
    return localStorage.getItem("token")
}

function parseCitations(value: Message["citations"]): Citation[] {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === "string") {
        try {
            return JSON.parse(value)
        } catch {
            return []
        }
    }
    return []
}

function normalizeMessage(message: Message): Message {
    return {
        ...message,
        citations: parseCitations(message.citations),
    }
}

export async function getDocumentConversation(id: number) {
    const response = await fetch(`${API_URL}/api/documents/${id}/conversation`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
    })

    const result = await response.json()

    if (result.success) {
        return result.data.map(normalizeMessage)
    }

    return []
}

export async function sendUserMessage(userInput: string, id: number) {
    const response = await fetch(`${API_URL}/api/documents/${id}/conversation`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
            role: "user",
            content: userInput,
        }),
    })

    const result = await response.json()

    if (result.success) {
        return {
            userMessage: normalizeMessage(result.userMessage),
            assistantMessage: normalizeMessage({
                ...result.assistantMessage,
                citations: result.citations || result.assistantMessage.citations,
            }),
            citations: result.citations || [],
            retrieval: result.retrieval,
        }
    }

    throw new Error(result.message || "failed to send message")
}
