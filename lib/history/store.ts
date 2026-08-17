import { randomUUID } from "crypto";
import { createJsonFileStore } from "@/lib/jsonFileStore";
import type { Conversation, ConversationSummary, StoredMessage } from "@/lib/history/types";

const DEFAULT_TITLE = "新對話";
const MAX_TITLE_LENGTH = 30;

const store = createJsonFileStore<{ conversations: Conversation[] }>(
  "conversations.json",
  { conversations: [] }
);

function toSummary({ messages, ...rest }: Conversation): ConversationSummary {
  return { ...rest, messageCount: messages.length };
}

function deriveTitle(messages: StoredMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return DEFAULT_TITLE;
  const text = firstUserMessage.content.trim().replace(/\s+/g, " ");
  return text.length > MAX_TITLE_LENGTH
    ? `${text.slice(0, MAX_TITLE_LENGTH)}…`
    : text || DEFAULT_TITLE;
}

export function listConversations(): Promise<ConversationSummary[]> {
  return store.transact((data) =>
    [...data.conversations]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(toSummary)
  );
}

export function getConversation(id: string): Promise<Conversation | null> {
  return store.transact(
    (data) => data.conversations.find((c) => c.id === id) ?? null
  );
}

export function createConversation(): Promise<Conversation> {
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: randomUUID(),
    title: DEFAULT_TITLE,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  return store.transactAndSave((data) => {
    data.conversations.push(conversation);
    return conversation;
  });
}

export function replaceMessages(
  id: string,
  messages: StoredMessage[]
): Promise<Conversation | null> {
  return store.transactAndSave((data) => {
    const conversation = data.conversations.find((c) => c.id === id);
    if (!conversation) return null;
    conversation.messages = messages;
    conversation.updatedAt = new Date().toISOString();
    if (conversation.title === DEFAULT_TITLE) {
      conversation.title = deriveTitle(messages);
    }
    return conversation;
  });
}

export function renameConversation(
  id: string,
  title: string
): Promise<Conversation | null> {
  return store.transactAndSave((data) => {
    const conversation = data.conversations.find((c) => c.id === id);
    if (!conversation) return null;
    conversation.title = title.trim() || DEFAULT_TITLE;
    conversation.updatedAt = new Date().toISOString();
    return conversation;
  });
}

export function deleteConversation(id: string): Promise<boolean> {
  return store.transactAndSave((data) => {
    const existed = data.conversations.some((c) => c.id === id);
    data.conversations = data.conversations.filter((c) => c.id !== id);
    return existed;
  });
}
