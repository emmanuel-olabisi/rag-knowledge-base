import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import {
    BrainCircuit,
    FileSearch,
    Layers3,
    Quote,
    Sparkles,
    Upload,
    Zap,
} from "lucide-react"

const features = [
    {
        icon: Upload,
        title: "Document ingestion",
        description: "Upload PDF or DOCX files and automatically extract, chunk, and embed content.",
    },
    {
        icon: FileSearch,
        title: "Hybrid retrieval",
        description: "Combine vector similarity with keyword search, reranking, and metadata-aware filtering.",
    },
    {
        icon: Quote,
        title: "Grounded citations",
        description: "Every answer links back to numbered source chunks so recruiters can trust the output.",
    },
    {
        icon: BrainCircuit,
        title: "Conversation memory",
        description: "Query rewriting and rolling summaries keep follow-up questions context-aware.",
    },
]

const pipeline = [
    "Upload document",
    "Chunk + embed",
    "Rewrite query",
    "Hybrid search",
    "Rerank sources",
    "Generate answer",
]

const stack = ["React", "TypeScript", "Express", "PostgreSQL", "pgvector", "OpenAI"]

function HomePage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen hero-grid">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Sparkles className="size-5" />
                    </div>
                    <div>
                        <p className="font-semibold tracking-tight">RAG Knowledge Base</p>
                        <p className="text-xs text-muted-foreground">Production-minded document AI</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate("/login")}>
                        Log in
                    </Button>
                    <Button onClick={() => navigate("/register")}>Get started</Button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
                <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-sm text-muted-foreground shadow-sm">
                            <Zap className="size-4 text-primary" />
                            Hybrid search · reranking · citations · memory
                        </div>

                        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-balance sm:text-6xl">
                            Chat with your documents using production-grade RAG
                        </h1>

                        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                            Upload knowledge, ask natural-language questions, and get AI answers
                            grounded in your sources with transparent citations and a modern
                            retrieval pipeline built for real-world use.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Button size="lg" onClick={() => navigate("/register")}>
                                Start for free
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link to="/login">Open workspace</Link>
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            {stack.map((item) => (
                                <span
                                    key={item}
                                    className="rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                            <Layers3 className="size-4 text-primary" />
                            Retrieval pipeline
                        </div>
                        <div className="space-y-3">
                            {pipeline.map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-3 rounded-xl border bg-background/80 px-4 py-3"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                                        {index + 1}
                                    </div>
                                    <span className="font-medium">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-24 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {features.map(({ icon: Icon, title, description }) => (
                        <div
                            key={title}
                            className="rounded-2xl border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="size-5" />
                            </div>
                            <h2 className="text-lg font-semibold">{title}</h2>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="mt-24 rounded-3xl border bg-primary px-8 py-10 text-primary-foreground shadow-2xl shadow-primary/20">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                Built to impress recruiters and hiring managers
                            </h2>
                            <p className="mt-3 max-w-2xl text-primary-foreground/85">
                                Full-stack auth, document management, hybrid retrieval, reranking,
                                citations, caching, and retrieval metrics — all in one polished demo.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            variant="secondary"
                            className="shrink-0"
                            onClick={() => navigate("/register")}
                        >
                            Launch the app
                        </Button>
                    </div>
                </section>
            </main>
        </div>
    )
}

export default HomePage
