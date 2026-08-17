"use client";

import { useChat, type Message } from "ai/react";
import { useEffect, useRef } from "react";
import ChatMessage from "@/components/ChatMessage";

export default function ChatWindow({
  conversationId,
  initialMessages,
  onExchangeComplete,
}: {
  conversationId: string | null;
  initialMessages: Message[];
  onExchangeComplete?: () => void;
}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, reload } =
    useChat({
      api: "/api/chat",
      initialMessages,
      body: { conversationId },
      onFinish: onExchangeComplete,
    });

  const bottomRef = useRef<HTMLDivElement>(null);
  const disabled = !conversationId;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
      <header className="border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h1 className="text-base font-semibold">AI Chat</h1>
        <p className="text-xs text-neutral-500">Powered by LiteLLM</p>
      </header>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-neutral-400">
            Send a message to start the conversation.
          </p>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} role={message.role} content={message.content} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            Something went wrong: {error.message}{" "}
            <button onClick={() => reload()} className="underline">
              Retry
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-black/10 p-3 dark:border-white/10">
        <textarea
          value={input}
          onChange={handleInputChange}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
            }
          }}
          placeholder={disabled ? "正在建立對話..." : "Type a message..."}
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 disabled:opacity-50 dark:border-white/10 dark:focus:border-white/30"
        />

        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-xl bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
