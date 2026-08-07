import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MessageBubble from "@/components/MessageBubble"
import { getDocumentConversation, sendUserMessage } from "@/services/conversationService"
import type { DocumentMeta } from "@/types/documents"
import type { Message } from "@/types/message"
import { FileText, Loader2, SendHorizontal, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type ChatLayoutProps = {
    selectedDocument: DocumentMeta | null
}

function ChatLayout({ selectedDocument }: ChatLayoutProps) {
    const [conversation, setConversation] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
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
    }, [conversation, isSending])

    async function handleSendButton() {
        if (!inputValue.trim() || !selectedDocument || isSending) return

        setIsSending(true)
        setError("")

        try {
            const insertedMessages = await sendUserMessage(inputValue, selectedDocument.id)
            setConversation((prev) => [
                ...prev,
                insertedMessages.userMessage,
                insertedMessages.assistantMessage,
            ])
            setInputValue("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send message.")
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
                        <MessageBubble key={message.id} message={message} />
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
