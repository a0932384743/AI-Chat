import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "nodejs";

const litellm = createOpenAI({
  baseURL: process.env.LITELLM_BASE_URL ?? "http://localhost:4000",
  apiKey: process.env.LITELLM_API_KEY ?? "",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: litellm(process.env.LITELLM_MODEL ?? "gpt-4o-mini"),
    messages,
  });

  return result.toDataStreamResponse();
}
