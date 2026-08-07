import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MessageBubble from "@/components/MessageBubble"
import { getDocumentConversation, sendUserMessageStream } from "@/services/conversationService"
import { getUsername } from "@/lib/auth"
import type { DocumentMeta } from "@/types/documents"
import type { Message } from "@/types/message"
import { FileText, Loader2, SendHorizontal, Sparkles, UserRound } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type ChatLayoutProps = {
    selectedDocument: DocumentMeta | null
}

const STREAMING_MESSAGE_ID = -1

function ChatLayout({ selectedDocument }: ChatLayoutProps) {
    const [conversation, setConversation] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [username] = useState(getUsername)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!selectedDocument) {
            setConversation([])
            return
        }

        const loadConversation = async () => {
            setIsLoading(true)
            setError("")
            try {
                const loadedConversation = await getDocumentConversation(selectedDocument.id)
                setConversation(loadedConversation)
            } catch {
                setError("Failed to load conversation.")
            } finally {
                setIsLoading(false)
            }
        }

        loadConversation()
    }, [selectedDocument])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [conversation, isSending, isStreaming])

    async function handleSendButton() {
        if (!inputValue.trim() || !selectedDocument || isSending) return

        const userInput = inputValue.trim()
        setIsSending(true)
        setIsStreaming(true)
        setError("")
        setInputValue("")

        let streamedText = ""

        try {
            await sendUserMessageStream(userInput, selectedDocument.id, {
                onUserMessage: (userMessage) => {
                    setConversation((prev) => [...prev, userMessage])
                },
                onChunk: (chunk) => {
                    streamedText += chunk
                    setConversation((prev) => {
                        const withoutPlaceholder = prev.filter(
                            (message) => message.id !== STREAMING_MESSAGE_ID
                        )

                        return [
                            ...withoutPlaceholder,
                            {
                                id: STREAMING_MESSAGE_ID,
                                user_id: 0,
                                document_id: selectedDocument.id,
                                role: "assistant",
                                message: streamedText,
                                created_at: new Date().toISOString(),
                                citations: [],
                            },
                        ]
                    })
                },
                onDone: (assistantMessage) => {
                    setConversation((prev) => [
                        ...prev.filter((message) => message.id !== STREAMING_MESSAGE_ID),
                        assistantMessage,
                    ])
                    setIsStreaming(false)
                },
                onError: (message) => {
                    setError(message)
                    setConversation((prev) =>
                        prev.filter((message) => message.id !== STREAMING_MESSAGE_ID)
                    )
                    setIsStreaming(false)
                },
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send message.")
            setConversation((prev) =>
                prev.filter((message) => message.id !== STREAMING_MESSAGE_ID)
            )
            setIsStreaming(false)
        } finally {
            setIsSending(false)
        }
    }

    if (!selectedDocument) {
        return (
            <div className="flex flex-1 items-center justify-center bg-background">
                <div className="max-w-md rounded-3xl border bg-card px-8 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Sparkles className="size-7" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Select a document</h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Upload a PDF or DOCX file from the sidebar, then ask questions grounded
                        in your sources with hybrid search and citations.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen min-w-0 flex-1 flex-col bg-background">
            <header className="flex items-center justify-between border-b bg-card/80 px-6 py-4 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <h1 className="font-semibold tracking-tight">{selectedDocument.file_name}</h1>
                        <p className="text-xs text-muted-foreground">
                            Hybrid retrieval · reranking · source citations
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm">
                    <UserRound className="size-4 text-primary" />
                    <span className="font-medium">{username}</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 size-5 animate-spin" />
                        Loading conversation...
                    </div>
                ) : conversation.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="max-w-lg rounded-2xl border border-dashed bg-muted/30 px-6 py-8 text-center">
                            <h2 className="text-lg font-medium">Ask your first question</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Try “Summarize the main points” or “What does this document say
                                about pricing?”
                            </p>
                        </div>
                    </div>
                ) : (
                    conversation.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isStreaming={isStreaming && message.id === STREAMING_MESSAGE_ID}
                        />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            <div className="border-t bg-card/90 p-4 backdrop-blur md:px-8">
                {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
                <div className="mx-auto flex max-w-4xl gap-3">
                    <Input
                        placeholder="Ask a question about this document..."
                        className="h-12 flex-1"
                        value={inputValue}
                        disabled={isSending}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendButton()
                        }}
                    />
                    <Button
                        size="lg"
                        className="h-12 px-5"
                        onClick={handleSendButton}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <SendHorizontal className="size-4" />
                        )}
                        Send
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ChatLayout
