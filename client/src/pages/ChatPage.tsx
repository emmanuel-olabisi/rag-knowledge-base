import DocumentsSidebar from "@/components/DocumentsSidebar"
import ChatLayout from "@/components/ChatLayout"
import { useState, useEffect } from "react"
import type { DocumentMeta } from "@/types/documents"
import { getDocuments } from "@/services/documentService"

function ChatPage() {
    const [documents, setDocuments] = useState<DocumentMeta[]>([])
    const [selectedDocument, setSelectedDocument] = useState<DocumentMeta | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadDocuments = async () => {
            setIsLoading(true)
            try {
                const docs = await getDocuments()
                setDocuments(docs)
                if (docs.length > 0) {
                    setSelectedDocument(docs[0])
                }
            } finally {
                setIsLoading(false)
            }
        }

        loadDocuments()
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
                Loading workspace...
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <DocumentsSidebar
                documents={documents}
                selectedDocument={selectedDocument}
                setDocuments={setDocuments}
                setSelectedDocument={setSelectedDocument}
            />
            <ChatLayout selectedDocument={selectedDocument} />
        </div>
    )
}

export default ChatPage
