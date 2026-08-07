import type { Message } from "@/types/message"
import type { Citation } from "@/types/citations"
import { Bot, UserRound } from "lucide-react"

type MessageBubbleProps = {
    message: Message
}

function CitationList({ citations }: { citations: Citation[] }) {
    if (citations.length === 0) return null

    return (
        <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Sources
            </p>
            <div className="space-y-2">
                {citations.map((citation) => (
                    <details
                        key={citation.id}
                        className="rounded-lg border bg-background/70 px-3 py-2 text-xs"
                    >
                        <summary className="cursor-pointer font-medium text-primary">
                            [{citation.citationNumber}]{" "}
                            {citation.metadata?.file_name || "Document chunk"}
                            {citation.chunkIndex != null ? ` · section ${citation.chunkIndex + 1}` : ""}
                        </summary>
                        <p className="mt-2 leading-5 text-muted-foreground">
                            {citation.chunkText.slice(0, 240)}
                            {citation.chunkText.length > 240 ? "..." : ""}
                        </p>
                    </details>
                ))}
            </div>
        </div>
    )
}

function MessageBubble({ message }: MessageBubbleProps) {
    const isAssistant = message.role === "assistant"
    const citations = Array.isArray(message.citations) ? message.citations : []

    return (
        <div className={`mb-6 flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}>
            {isAssistant ? (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-4" />
                </div>
            ) : null}

            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    isAssistant
                        ? "rounded-tl-md border bg-card text-card-foreground"
                        : "rounded-tr-md bg-primary text-primary-foreground"
                }`}
            >
                <p className="whitespace-pre-wrap break-words leading-7">{message.message}</p>
                {isAssistant ? <CitationList citations={citations} /> : null}
            </div>

            {!isAssistant ? (
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <UserRound className="size-4" />
                </div>
            ) : null}
        </div>
    )
}

export default MessageBubble
