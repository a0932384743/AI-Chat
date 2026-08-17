import { streamText } from "ai";
import { CHAT_MODEL, litellm } from "@/lib/litellm";
import { cosineSimilarity, embedQuery } from "@/lib/kb/embeddings";
import { getAllChunks } from "@/lib/kb/store";

export const runtime = "nodejs";

const TOP_K = Number(process.env.KB_TOP_K ?? 4);
const MIN_SIMILARITY = Number(process.env.KB_MIN_SIMILARITY ?? 0.75);

async function buildKnowledgeBaseContext(query: string): Promise<string | null> {
  const chunks = await getAllChunks();
  if (chunks.length === 0) return null;

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(query);
  } catch (err) {
    console.error("KB query embedding failed", err);
    return null;
  }

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((entry) => entry.score >= MIN_SIMILARITY)
    .slice(0, TOP_K);

  if (ranked.length === 0) return null;

  return ranked
    .map(({ chunk }) => `[chunk ${chunk.index}]\n${chunk.text}`)
    .join("\n\n---\n\n");
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");

  const context = lastUserMessage
    ? await buildKnowledgeBaseContext(lastUserMessage.content)
    : null;

  const systemPrompt = context
    ? "You are a helpful assistant with access to a knowledge base. Use the " +
      "excerpts below to answer the user's question when they're relevant. " +
      "If the excerpts don't contain the answer, say so and answer from your " +
      "general knowledge instead.\n\n" +
      context
    : "You are a helpful assistant.";

  const result = await streamText({
    model: litellm(CHAT_MODEL),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
