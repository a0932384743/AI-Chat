import { randomUUID } from "crypto";
import { streamText } from "ai";
import { CHAT_MODEL, litellm } from "@/lib/litellm";
import { cosineSimilarity, embedQuery } from "@/lib/kb/embeddings";
import { getAllChunks } from "@/lib/kb/store";
import { replaceMessages } from "@/lib/history/store";
import type { StoredMessage } from "@/lib/history/types";

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
  const { messages, conversationId } = await req.json();
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
    async onFinish({ text }) {
      if (typeof conversationId !== "string") return;

      const history: StoredMessage[] = messages
        .filter((m: any) => ["system", "user", "assistant"].includes(m.role))
        .map((m: any) => ({
          id: m.id ?? randomUUID(),
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ?? new Date().toISOString(),
        }));

      history.push({
        id: randomUUID(),
        role: "assistant",
        content: text,
        createdAt: new Date().toISOString(),
      });

      try {
        await replaceMessages(conversationId, history);
      } catch (err) {
        console.error("Failed to persist conversation history", err);
      }
    },
  });

  return result.toDataStreamResponse();
}
