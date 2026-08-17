# AI Chat

A Next.js chat window integrated with [LiteLLM](https://github.com/BerriAI/litellm), using the
Vercel AI SDK for streaming responses. LiteLLM lets you talk to 100+ LLM providers
(OpenAI, Anthropic, Azure, Ollama, etc.) through a single OpenAI-compatible API.

It also includes a small file-based **knowledge base**: upload PDFs, Word docs, text
files, or images, and the chat answers questions grounded in their content
(retrieval-augmented generation) — plus **persistent chat history**, so past
conversations are saved and can be revisited or deleted.

## Requirements

- Node.js 18+
- A running LiteLLM proxy server

## 1. Start a LiteLLM proxy

Install LiteLLM and run the proxy with the included config (`litellm.config.yaml`), which
registers both a chat model and an embedding model — the knowledge base needs both:

```bash
pip install 'litellm[proxy]'
# edit litellm.config.yaml if you want different models/providers
export OPENAI_API_KEY=sk-...
litellm --config litellm.config.yaml --port 4000
```

The proxy now exposes an OpenAI-compatible API at `http://localhost:4000`.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in:

- `LITELLM_BASE_URL` — base URL of your LiteLLM proxy (default `http://localhost:4000`)
- `LITELLM_API_KEY` — the proxy's master key or a virtual key
- `LITELLM_MODEL` — the `model_name` registered in your LiteLLM config for chat
- `LITELLM_EMBEDDING_MODEL` — the `model_name` registered for embeddings (used by the
  knowledge base)
- `LITELLM_VISION_MODEL` — optional; a vision-capable model for transcribing uploaded
  images (defaults to `LITELLM_MODEL`)

## 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Knowledge base

The left-hand panel lets you upload documents:

- **PDF** (`.pdf`), **Word** (`.docx`), **text/markdown/CSV/JSON**
- **Images** (`.png`, `.jpg`, `.webp`, ...) — transcribed/described via a vision-capable
  LiteLLM model, so their content becomes searchable too

On upload, the file's text is extracted, split into overlapping chunks, embedded via
LiteLLM, and stored locally (`data/kb-store.json` by default). When you send a chat
message, the app embeds your question, retrieves the most similar chunks, and injects
them into the model's system prompt so it can answer using your documents — falling back
to general knowledge when nothing relevant is found.

Tuning via env vars: `KB_DATA_DIR` (storage location), `KB_MAX_FILE_SIZE_MB` (upload
limit, default 15), `KB_TOP_K` (chunks retrieved per question, default 4),
`KB_MIN_SIMILARITY` (relevance cutoff, default 0.75).

## Chat history

The left-most panel lists past conversations. A new one is created automatically when
you first open the app; use **+ 新對話** to start another, click a past conversation to
resume it (its messages reload into the chat window), or **刪除** to remove it. Every
exchange is saved after the model finishes replying — the title is auto-generated from
your first message — to `data/conversations.json` by default (same `KB_DATA_DIR` as the
knowledge base).

## How it works

- `app/api/chat/route.ts` — retrieves relevant knowledge base chunks for the latest user
  message, streams a response from LiteLLM via `@ai-sdk/openai`, then persists the
  conversation's messages once the reply finishes.
- `app/api/kb/documents/route.ts`, `app/api/kb/documents/[id]/route.ts` — upload/list/delete
  knowledge base documents.
- `app/api/conversations/route.ts`, `app/api/conversations/[id]/route.ts` —
  list/create/fetch/rename/delete chat conversations.
- `lib/kb/extract.ts`, `extractImage.ts` — turn PDFs/DOCX/text/images into plain text.
- `lib/kb/chunk.ts`, `embeddings.ts` — chunking and embedding.
- `lib/jsonFileStore.ts` — small JSON-file-backed store with serialized writes, shared by
  `lib/kb/store.ts` (documents/chunks + cosine similarity search) and
  `lib/history/store.ts` (conversations).
- `components/ChatApp.tsx` — client-side orchestrator wiring the conversation list, the
  knowledge base panel, and the chat window together.
- `components/ChatWindow.tsx` / `ChatMessage.tsx` — chat UI built on the AI SDK's `useChat`
  hook.
- `components/ConversationList.tsx` — history sidebar.
- `components/KnowledgeBase.tsx` — upload form and document list.

Because LiteLLM speaks the OpenAI API, swapping the underlying model/provider only
requires changing `litellm.config.yaml` — no app code changes needed.

## Deploying to Render

`render.yaml` defines a [Render Blueprint](https://render.com/docs/blueprint-spec) with two
services:

- `litellm-proxy` — built from `docker/litellm/Dockerfile`, which bakes the repo's
  `litellm.config.yaml` into the official LiteLLM image (no secrets in the file — it only
  references env var names).
- `ai-chat-web` — this Next.js app, wired to `litellm-proxy` over Render's internal network
  (`http://litellm-proxy:4000`), with `LITELLM_API_KEY` pulled automatically from the proxy's
  generated master key.

To deploy:

1. Push this repo to GitHub/GitLab.
2. In the Render dashboard, choose **New +** → **Blueprint** and point it at the repo. Render
   will pick up `render.yaml` automatically.
3. When prompted, set the `OPENAI_API_KEY` secret on `litellm-proxy` (marked `sync: false` so
   Render asks for it instead of storing it in the repo).
4. Deploy. `ai-chat-web`'s public URL serves the chat window.

Notes:

- To use different providers/models, edit `litellm.config.yaml`'s `model_list` and set the
  matching provider key(s) (`ANTHROPIC_API_KEY`, etc.) on `litellm-proxy`, then update
  `LITELLM_MODEL` / `LITELLM_EMBEDDING_MODEL` on `ai-chat-web` to match.
- If your Render account doesn't auto-fill `LITELLM_API_KEY` via `fromService`/`envVarKey`,
  copy `LITELLM_MASTER_KEY`'s generated value from the `litellm-proxy` service's Environment tab
  into `ai-chat-web`'s `LITELLM_API_KEY` manually.
- **Data persistence**: by default `KB_DATA_DIR` (`/var/data/kb`) — which holds both the
  knowledge base and chat history JSON files — lives on the service's ephemeral disk and
  resets on every deploy. To persist uploads and chat history, attach a
  [Render Disk](https://render.com/docs/disks) to `ai-chat-web` mounted at that path, e.g.
  add under its service definition:
  ```yaml
  disk:
    name: kb-data
    mountPath: /var/data/kb
    sizeGB: 1
  ```
