import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteDocument, renameDocument } from "@/services/documentService"
import type { DocumentMeta } from "@/types/documents"
import {
    FileText,
    Loader2,
    LogOut,
    MoreVertical,
    Upload,
} from "lucide-react"
import { useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react"
import { useNavigate } from "react-router-dom"

const VITE_API_URL = import.meta.env.VITE_API_URL

type DSidebarProps = {
    documents: DocumentMeta[]
    selectedDocument: DocumentMeta | null
    setDocuments: Dispatch<SetStateAction<DocumentMeta[]>>
    setSelectedDocument: Dispatch<SetStateAction<DocumentMeta | null>>
}

function DocumentsSidebar({
    documents,
    selectedDocument,
    setDocuments,
    setSelectedDocument,
}: DSidebarProps) {
    const token = localStorage.getItem("token")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [documentName, setDocumentName] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState("")
    const navigate = useNavigate()

    function openFileManager() {
        fileInputRef.current?.click()
    }

    async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
        if (!event.target.files?.[0]) return

        const file = event.target.files[0]
        const formData = new FormData()
        formData.append("file", file)

        setIsUploading(true)
        setUploadError("")

        try {
            const response = await fetch(`${VITE_API_URL}/api/documents/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const result = await response.json()

            if (result.success) {
                setDocuments((prev) => [result.data, ...prev])
                setSelectedDocument(result.data)
            } else {
                setUploadError(result.message || "Upload failed.")
            }
        } catch {
            setUploadError("Upload failed. Check your connection.")
        } finally {
            setIsUploading(false)
            event.target.value = ""
        }
    }

    return (
        <aside className="flex h-screen w-80 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="border-b border-sidebar-border px-5 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold tracking-tight">Knowledge Base</h2>
                        <p className="text-xs text-sidebar-foreground/70">Your document library</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
                <input
                    className="hidden"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                />

                <Button
                    className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    onClick={openFileManager}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Upload className="size-4" />
                    )}
                    Upload document
                </Button>

                {uploadError ? (
                    <p className="text-xs text-red-300">{uploadError}</p>
                ) : null}

                <div className="flex-1 space-y-2 overflow-y-auto">
                    {documents.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-sidebar-border px-4 py-6 text-center text-sm text-sidebar-foreground/70">
                            No documents yet. Upload your first file to start chatting.
                        </div>
                    ) : (
                        documents.map((item) => (
                            <div className="flex items-center gap-1" key={item.id}>
                                {editingId === item.id ? (
                                    <Input
                                        className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                                        type="text"
                                        value={documentName}
                                        onChange={(e) => setDocumentName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setDocuments((prev) =>
                                                    prev.map((obj) =>
                                                        item.id === obj.id
                                                            ? { ...obj, file_name: documentName }
                                                            : obj
                                                    )
                                                )
                                                renameDocument(documentName, item.id)
                                                setEditingId(null)
                                            }
                                        }}
                                    />
                                ) : (
                                    <Button
                                        variant="ghost"
                                        className={`h-11 flex-1 justify-start truncate border ${
                                            selectedDocument?.id === item.id
                                                ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                                                : "border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
                                        }`}
                                        onClick={() => setSelectedDocument(item)}
                                    >
                                        <FileText className="mr-2 size-4 shrink-0" />
                                        {item.file_name}
                                    </Button>
                                )}

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex size-9 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
                                            <MoreVertical className="size-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setEditingId(item.id)
                                                setDocumentName(item.file_name)
                                            }}
                                        >
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setDocuments((prev) =>
                                                    prev.filter((obj) => item.id !== obj.id)
                                                )
                                                if (selectedDocument?.id === item.id) {
                                                    setSelectedDocument(null)
                                                }
                                                deleteDocument(item.id)
                                            }}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-sidebar-border p-4">
                <Button
                    variant="outline"
                    className="w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/login")
                    }}
                >
                    <LogOut className="size-4" />
                    Log out
                </Button>
            </div>
        </aside>
    )
}

export default DocumentsSidebar
