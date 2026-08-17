# AI Chat

A Next.js chat window integrated with [LiteLLM](https://github.com/BerriAI/litellm), using the
Vercel AI SDK for streaming responses. LiteLLM lets you talk to 100+ LLM providers
(OpenAI, Anthropic, Azure, Ollama, etc.) through a single OpenAI-compatible API.

## Requirements

- Node.js 18+
- A running LiteLLM proxy server

## 1. Start a LiteLLM proxy

Install LiteLLM and run the proxy with a config file (see `litellm.config.example.yaml`):

```bash
pip install 'litellm[proxy]'
cp litellm.config.example.yaml litellm.config.yaml
# edit litellm.config.yaml with your provider API key(s) and model(s)
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
- `LITELLM_MODEL` — the `model_name` registered in your LiteLLM config

## 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## How it works

- `app/api/chat/route.ts` — API route that forwards chat messages to LiteLLM via
  `@ai-sdk/openai`'s OpenAI-compatible client and streams the response back.
- `components/ChatWindow.tsx` — chat UI (message list, input box, streaming/stop state)
  built on the AI SDK's `useChat` hook.
- `components/ChatMessage.tsx` — renders a single chat bubble.

Because LiteLLM speaks the OpenAI API, swapping the underlying model/provider only
requires changing `litellm.config.yaml` — no app code changes needed.

## Deploying to Render

`render.yaml` defines a [Render Blueprint](https://render.com/docs/blueprint-spec) with two
services:

- `litellm-proxy` — runs the official `ghcr.io/berriai/litellm` image directly (no Dockerfile
  needed), started with `--model gpt-4o-mini`.
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

- To use a different provider/model, edit `dockerCommand` on `litellm-proxy` (e.g.
  `--model claude-3-5-sonnet-20241022`) and set the matching provider key (`ANTHROPIC_API_KEY`,
  etc.) instead of/alongside `OPENAI_API_KEY`, and update `LITELLM_MODEL` on `ai-chat-web` to
  match.
- For multiple models, swap the CLI `--model` flag for a mounted config file (see
  `litellm.config.example.yaml`) instead.
- If your Render account doesn't auto-fill `LITELLM_API_KEY` via `fromService`/`envVarKey`,
  copy `LITELLM_MASTER_KEY`'s generated value from the `litellm-proxy` service's Environment tab
  into `ai-chat-web`'s `LITELLM_API_KEY` manually.
