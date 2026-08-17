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
