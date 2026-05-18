# 🐾 Pawrplexity

> A full-stack, production-grade AI search engine inspired by Perplexity — built from scratch with real-time web search, streaming LLM responses, conversation history, and a Material Design 3 UI.

![Tech Stack](https://img.shields.io/badge/Stack-Bun%20%7C%20Express%20%7C%20React%20%7C%20Vite-blueviolet)
![AI](https://img.shields.io/badge/AI-Llama%203.3%2070B%20via%20Cloudflare-orange)
![Search](https://img.shields.io/badge/Search-Tavily%20API-green)
![Auth](https://img.shields.io/badge/Auth-Supabase-teal)
![DB](https://img.shields.io/badge/DB-PostgreSQL%20%2B%20Prisma-blue)

---

## 📸 What it does

- 🔍 **Web-grounded AI answers** — every query searches the web first via Tavily, then synthesises the results using Llama 3.3 70B
- ⚡ **Real-time streaming** — token-by-token streaming from the LLM directly to the browser
- 💬 **Conversation memory** — follow-up questions retain full chat history; the model never loses context
- 🔗 **Source citations** — every answer shows the web sources it was built from
- 🪄 **Follow-up chips** — the model generates suggested follow-up questions rendered as clickable UI chips
- 🔐 **Auth** — Google, GitHub, or magic-link email login via Supabase
- 🕓 **History** — every conversation is saved and browsable with search & filters

---

## 🏗️ Architecture

```
pawrplexity/
├── backend/          # Express + Bun API server (port 3001)
│   ├── index.ts      # API routes (streaming, conversations)
│   ├── middleware.ts  # Supabase JWT auth middleware
│   ├── db.ts         # Prisma client setup
│   ├── promt.ts      # LLM system prompt + context template
│   └── prisma/
│       └── schema.prisma
│
└── frontend/         # React + Vite SPA (port 3000)
    └── src/
        ├── pages/
        │   ├── Auth.tsx        # Login (Google, GitHub, magic link)
        │   ├── Dashboard.tsx   # Layout wrapper + session guard
        │   ├── ChatScreen.tsx  # Main search + streaming chat UI
        │   ├── History.tsx     # Past conversations with search
        │   └── Tools.tsx       # Account info page
        ├── components/
        │   └── Sidebar.tsx     # Nav sidebar with recent convos
        └── lib/
            ├── client.ts       # Supabase browser client
            └── config.ts       # Backend URL config
```

### Request flow
```
User types query
  → POST /pawrplexity_ask
  → Tavily web search (advanced depth)
  → Llama 3.3 70B (Cloudflare Workers AI)
  → SSE text stream → browser renders live
  → Sources appended at end of stream
  → Message saved to PostgreSQL via Prisma
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Backend framework | Express.js |
| LLM | Llama 3.3 70B via [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) |
| LLM SDK | [Vercel AI SDK](https://sdk.vercel.ai) (`streamText`) |
| Web search | [Tavily API](https://tavily.com) |
| Auth | [Supabase](https://supabase.com) (Google, GitHub, magic link) |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| ORM | [Prisma v7](https://www.prisma.io) |
| Frontend framework | React 19 + [Vite](https://vitejs.dev) |
| Styling | Tailwind CSS v4 + Material Design 3 tokens |
| Icons | Google Material Symbols |
| Markdown | `react-markdown` |
| Router | React Router v7 |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Tavily Search
TAVILY_API_KEY=tvly-your-key

# Database (Supabase Postgres)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-xx.pooler.supabase.com:5432/postgres
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

---

## 🚀 Running Locally

### Prerequisites
- [Bun](https://bun.sh) installed
- Supabase project created
- Cloudflare account with Workers AI enabled
- Tavily API key

### 1. Clone the repo
```bash
git clone https://github.com/rushHead/Pawrplexity.git
cd Pawrplexity
```

### 2. Install dependencies

```bash
# Backend
cd backend && bun install

# Frontend
cd ../frontend && bun install
```

### 3. Set up environment variables
Copy and fill in both `.env` files as shown above.

### 4. Set up the database

```bash
cd backend
bunx prisma generate
bunx prisma db push
```

### 5. Start the backend

```bash
cd backend
bun run index.ts
# Server running on http://localhost:3001
```

### 6. Start the frontend

```bash
cd frontend
bun run dev
# App running on http://localhost:3000
```

---

## 🗄️ Database Schema

```prisma
model User {
  id            String         @id
  authProvider  AuthProvider
  conversations Conversation[]
}

model Conversation {
  id       String    @id @default(uuid())
  title    String
  slug     String    @unique
  userId   String
  user     User      @relation(fields: [userId], references: [id])
  messages Message[]
}

model Message {
  id             String       @id @default(uuid())
  content        String
  role           String       // "User" or "Assistant"
  createdAt      DateTime     @default(now())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}
```

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/conversations` | ✅ | List all conversations for the user |
| `GET` | `/conversations/:id` | ✅ | Get a conversation with all messages |
| `POST` | `/pawrplexity_ask` | ✅ | Start a new conversation (streams SSE) |
| `POST` | `/pawrplexity_ask/follow_up` | ✅ | Continue an existing conversation (streams SSE) |

**Auth header:** `Authorization: <supabase_access_token>`

**Stream format:**
```
[status text lines...]
[LLM token stream...]

<SOURCES>
[{"url": "https://..."}, ...]
</SOURCES>
```

---

## 🚢 Deploying

### Backend → [Railway](https://railway.app)
1. Connect your GitHub repo
2. Set root directory to `backend/`
3. Start command: `bun run index.ts`
4. Add all backend env variables in Railway dashboard
5. Railway gives you a public URL

### Frontend → [Vercel](https://vercel.com)
1. Connect your GitHub repo
2. Set root directory to `frontend/`
3. Build command: `bun run build`
4. Output directory: `dist`
5. Add `VITE_BACKEND_URL=https://your-railway-url.up.railway.app`

### Supabase Auth redirect URLs
In **Supabase → Authentication → URL Configuration**, add:
```
https://your-vercel-app.vercel.app
https://your-vercel-app.vercel.app/auth/callback
```

### Update CORS in backend
```ts
app.use(cors({ origin: ["http://localhost:3000", "https://your-vercel-app.vercel.app"] }));
```

---

## 🛠️ How It Was Built — Step by Step

1. **Scaffolded the monorepo** — Bun workspace with `backend/` and `frontend/` directories
2. **Built the Express backend** — REST API with SSE streaming endpoints for initial queries and follow-ups
3. **Integrated Tavily** — `@tavily/core` for real-time web search with `advanced` depth
4. **Integrated Cloudflare Workers AI** — via OpenAI-compatible API using Vercel AI SDK's `streamText`
5. **Chose Llama 3.3 70B** — upgraded from 8B for better instruction-following and reliable follow-up generation
6. **Engineered the system prompt** — forced structured output with a `### Follow-up Questions` section for consistent frontend parsing
7. **Smart follow-up search** — detects vague queries (e.g. "tell me more") and enriches them with the original conversation title for better web search results
8. **Set up Prisma + Supabase Postgres** — `User`, `Conversation`, `Message` schema with Prisma v7 driver adapter pattern
9. **Supabase auth middleware** — JWT verification on every protected route using `SUPABASE_JWT_SECRET`
10. **Built the React frontend** — React 19 + Vite + React Router v7 with nested layout routes
11. **Implemented SSE streaming on the client** — `fetch()` + `ReadableStream` reader consuming the SSE text stream token by token
12. **Parsed sources from stream** — `<SOURCES>` delimiter parsed out of the raw stream and rendered as pill chips
13. **Parsed follow-up questions** — regex extraction of `### Follow-up Questions` section into interactive chips
14. **Integrated `react-markdown`** — full markdown rendering for AI responses (headings, lists, code blocks)
15. **Material Design 3 UI overhaul** — custom MD3 color tokens in Tailwind v4 CSS variables, Material Symbols icons, Inter + JetBrains Mono fonts
16. **Built all pages** — `Auth`, `ChatScreen` (home + chat), `History` (with search + filters), `Tools`, `Sidebar`
17. **Fixed conversation memory** — shifted from text concatenation to structured `messages[]` array passed to the LLM
18. **Fixed navigation state** — `sessionStorage` pending nav pattern to avoid interrupting active streams
19. **Pushed to GitHub** — version controlled at `github.com/rushHead/Pawrplexity`

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
