# RAG Knowledge Base

A production-quality full-stack **Retrieval-Augmented Generation (RAG)** application for uploading documents, asking natural language questions, and receiving AI answers grounded in source chunks with transparent citations.

Built with **React, TypeScript, Express, PostgreSQL + pgvector, and OpenAI**.

---

## Live Demo

- Frontend: https://rag-knowledge-base-43xu.vercel.app/
- Backend API: https://rag-knowledge-base-production-1844.up.railway.app

---

## Why this project stands out

This is not a basic “embed chunks and call GPT” demo. The retrieval stack includes the same layers teams add when moving RAG from prototype to production:

1. **Vector search** — semantic retrieval with pgvector cosine similarity
2. **Metadata filtering** — chunk-level metadata for document-aware filtering
3. **Hybrid search** — vector + PostgreSQL full-text search fused with reciprocal rank fusion (RRF)
4. **Query rewriting** — standalone search queries generated from conversation context
5. **Reranking** — LLM reranking over hybrid candidates before generation
6. **Citations** — numbered source excerpts returned with every assistant answer
7. **Retrieval evaluation metrics** — latency, cache hit rate, and query logs via `/api/eval/metrics`
8. **Caching + conversation memory** — embedding/retrieval caching and rolling conversation summaries

---

## Architecture

```text
Upload Document
      │
      ▼
Extract Text → Chunk (overlap) → Embed → Store vectors + tsvector + metadata
      │
────────────────────────────────────────────────────────────
      │
User Question
      │
      ▼
Rewrite Query (conversation-aware)
      │
      ├── Vector Search (top 20)
      └── Keyword Search / BM25-like ts_rank (top 20)
      │
      ▼
Reciprocal Rank Fusion
      │
      ▼
LLM Reranking → Top 5 Sources
      │
      ▼
Prompt with numbered citations + conversation memory
      │
      ▼
OpenAI Chat Completion → Answer + source citations
```

---

## Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- React Router
- Lucide icons

### Backend
- Node.js + Express 5
- PostgreSQL + pgvector
- JWT authentication
- OpenAI Embeddings + Chat Completions
- Multer + Mammoth (DOCX extraction)

---

## Project Structure

```text
rag-knowledge-base/
├── client/
│   ├── src/
│   │   ├── components/      # Chat UI, sidebar, message bubbles
│   │   ├── pages/           # Landing, auth, chat workspace
│   │   ├── services/        # API clients
│   │   └── types/           # Documents, messages, citations
│   └── vercel.json          # SPA routing for direct URL access
├── server/
│   ├── db/migrations/       # Production RAG schema upgrade
│   ├── routes/              # Auth, documents, eval metrics
│   └── services/
│       ├── retrievalService.js    # Hybrid search + RRF
│       ├── queryRewriteService.js # Context-aware query rewriting
│       ├── rerankService.js       # LLM reranking
│       ├── memoryService.js       # Conversation summaries
│       ├── cacheService.js        # Embedding + retrieval cache
│       ├── evalService.js         # Retrieval metrics/logging
│       ├── embeddingService.js
│       ├── chunkService.js
│       └── openaiService.js
└── README.md
```

---

## Database Design

| Table | Purpose |
|-------|---------|
| `users` | Authentication |
| `documents` | Uploaded file metadata |
| `document_chunks` | Chunk text, embeddings, metadata, full-text vectors |
| `conversations` | Chat history + citation payloads |
| `conversation_summaries` | Rolling conversation memory |
| `retrieval_logs` | Retrieval evaluation metrics |

---

## Installation

```bash
git clone https://github.com/emmanuelboop/rag-knowledge-base.git
cd rag-knowledge-base/client && npm install
cd ../server && npm install
```

---

## Environment Variables

### Server (`server/.env`)

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
```

---

## Database Migration (required for production RAG features)

Run once against your PostgreSQL database.

### If your database is on Neon (recommended)

1. Open the [Neon Console](https://console.neon.tech) → your project → **SQL Editor**
2. Paste and run the contents of `server/db/migrations/001_rag_upgrade.sql`
3. Confirm `pgvector` is enabled — the migration runs `CREATE EXTENSION IF NOT EXISTS vector;`

**Or run locally** using the same connection string Neon gives you (also set as `DATABASE_URL` on Railway):

```bash
cd server
# server/.env should contain your Neon DATABASE_URL
npm run migrate
```

In Neon, copy the connection string from **Dashboard → Connect** (pooled or direct both work for migrations).

### Generic PostgreSQL

```bash
psql $DATABASE_URL -f server/db/migrations/001_rag_upgrade.sql
```

This adds:
- chunk metadata + `tsvector` for hybrid search
- citation storage on conversations
- conversation summaries
- retrieval logs for evaluation metrics

---

## Running Locally

```bash
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev
```

---

## API Highlights

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/signup` | Create account |
| `POST /api/auth/login` | JWT login |
| `POST /api/documents/upload` | Upload + ingest document |
| `GET /api/documents/` | List user documents |
| `POST /api/documents/:id/conversation` | RAG chat with citations |
| `GET /api/eval/metrics` | Retrieval metrics dashboard data |

### Example RAG response shape

```json
{
  "success": true,
  "assistantMessage": { "...": "..." },
  "citations": [
    {
      "citationNumber": 1,
      "chunkText": "...",
      "metadata": { "file_name": "report.docx", "chunk_index": 0 }
    }
  ],
  "retrieval": {
    "cacheHit": false,
    "candidateCount": 18,
    "latencyMs": 842
  }
}
```

---

## Deployment

- **Frontend:** Vercel (`client/`), with SPA rewrites via `vercel.json`
- **Backend:** Railway (`server/`), uses `npm start`
- Set environment variables in both platforms
- Run the SQL migration against your production database before deploying the new backend

---

## Features

### Authentication
- Secure JWT auth
- Protected chat routes
- Clear signup/login error handling

### Document Management
- Upload PDF and DOCX
- Rename and delete documents
- Persistent per-user library

### Production RAG Pipeline
- Chunk overlap for better recall
- Metadata-aware retrieval
- Hybrid vector + keyword search
- Query rewriting from conversation history
- LLM reranking
- Inline + expandable source citations
- Embedding and retrieval caching
- Conversation memory via summaries
- Retrieval logging and metrics endpoint

---

## Future Improvements

- Cross-encoder reranking model
- Response streaming
- Multi-document retrieval
- OCR for scanned PDFs
- Admin dashboard for eval metrics
- Redis-backed distributed cache

---

## Author

**Emmanuel Olabisi**

- GitHub: https://github.com/emmanuelboop
- LinkedIn: https://www.linkedin.com/in/emmanuel-olabisi-4901b2236/

---

## License

MIT License
