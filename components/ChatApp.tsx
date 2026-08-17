"use client";

import type { Message } from "ai/react";
import { useCallback, useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import ConversationList from "@/components/ConversationList";
import KnowledgeBase from "@/components/KnowledgeBase";

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

export default function ChatApp() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (!res.ok) return [] as ConversationSummary[];
    const data = await res.json();
    const list: ConversationSummary[] = data.conversations ?? [];
    setConversations(list);
    return list;
  }, []);

  const createConversation = useCallback(async () => {
    const res = await fetch("/api/conversations", { method: "POST" });
    const data = await res.json();
    setActiveId(data.conversation.id);
    setInitialMessages([]);
    await loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    (async () => {
      const list = await loadConversations();
      if (list.length > 0) {
        await selectConversation(list[0].id);
      } else {
        await createConversation();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveId(id);
    setInitialMessages(
      data.conversation.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      }))
    );
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    const list = await loadConversations();
    if (activeId === id) {
      if (list.length > 0) {
        await selectConversation(list[0].id);
      } else {
        await createConversation();
      }
    }
  }

  return (
    <>
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={selectConversation}
        onNew={createConversation}
        onDelete={deleteConversation}
      />
      <KnowledgeBase />
      <ChatWindow
        key={activeId ?? "pending"}
        conversationId={activeId}
        initialMessages={initialMessages}
        onExchangeComplete={loadConversations}
      />
    </>
  );
}
