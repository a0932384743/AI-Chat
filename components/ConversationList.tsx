"use client";

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.round(hours / 24);
  return `${days} 天前`;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-[85vh] w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div>
          <h2 className="text-base font-semibold">歷史對話</h2>
          <p className="text-xs text-neutral-500">{conversations.length} 筆紀錄</p>
        </div>
        <button
          onClick={onNew}
          className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
        >
          + 新對話
        </button>
      </header>

      <div className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 && (
          <p className="mt-6 text-center text-sm text-neutral-400">尚無對話紀錄</p>
        )}

        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`group flex cursor-pointer items-start justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
              c.id === activeId
                ? "bg-neutral-200 dark:bg-neutral-700"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium" title={c.title}>
                {c.title}
              </p>
              <p className="text-xs text-neutral-500">
                {formatRelativeTime(c.updatedAt)} · {c.messageCount} 則訊息
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(c.id);
              }}
              className="shrink-0 text-xs text-red-500 opacity-0 group-hover:opacity-100 hover:underline"
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
