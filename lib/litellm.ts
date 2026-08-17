import { createOpenAI } from "@ai-sdk/openai";

export const litellm = createOpenAI({
  baseURL: process.env.LITELLM_BASE_URL ?? "http://localhost:4000",
  apiKey: process.env.LITELLM_API_KEY ?? "",
});

export const CHAT_MODEL = process.env.LITELLM_MODEL ?? "gpt-4o-mini";
export const VISION_MODEL = process.env.LITELLM_VISION_MODEL ?? CHAT_MODEL;
export const EMBEDDING_MODEL =
  process.env.LITELLM_EMBEDDING_MODEL ?? "text-embedding-3-small";
