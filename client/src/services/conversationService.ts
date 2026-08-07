import type { Message } from "@/types/message"
import type { Citation } from "@/types/citations"
import { getToken } from "@/lib/auth"

const API_URL = import.meta.env.VITE_API_URL

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

type StreamCallbacks = {
    onUserMessage: (message: Message) => void
    onChunk: (chunk: string) => void
    onDone: (assistantMessage: Message, citations: Citation[]) => void
    onError: (message: string) => void
}

export async function sendUserMessageStream(
    userInput: string,
    id: number,
    callbacks: StreamCallbacks
) {
    const response = await fetch(`${API_URL}/api/documents/${id}/conversation/stream`, {
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

    if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message || "failed to send message")
    }

    if (!response.body) {
        throw new Error("streaming is not supported in this browser")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const event of events) {
            const dataLine = event
                .split("\n")
                .find((line) => line.startsWith("data: "))

            if (!dataLine) continue

            const payload = JSON.parse(dataLine.slice(6))

            if (payload.type === "userMessage") {
                callbacks.onUserMessage(normalizeMessage(payload.data))
            }

            if (payload.type === "chunk") {
                callbacks.onChunk(payload.content)
            }

            if (payload.type === "done") {
                callbacks.onDone(
                    normalizeMessage({
                        ...payload.assistantMessage,
                        citations: payload.citations,
                    }),
                    payload.citations || []
                )
            }

            if (payload.type === "error") {
                callbacks.onError(payload.message || "server error")
            }
        }
    }
}
