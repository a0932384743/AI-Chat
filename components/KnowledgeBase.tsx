"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type KbDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    const res = await fetch("/api/kb/documents");
    if (!res.ok) return;
    const data = await res.json();
    setDocuments(data.documents ?? []);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/kb/documents", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
      } else {
        await loadDocuments();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    await fetch(`/api/kb/documents/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex h-[85vh] w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-neutral-900">
      <header className="border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h2 className="text-base font-semibold">知識庫</h2>
        <p className="text-xs text-neutral-500">上傳文件，讓 AI 依內容回答問題</p>
      </header>

      <div className="border-b border-black/10 p-3 dark:border-white/10">
        <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-black/20 px-3 py-4 text-sm text-neutral-500 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40">
          {isUploading ? "上傳中..." : "點擊上傳 PDF / Word / 圖片 / 文字檔"}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            disabled={isUploading}
            accept=".pdf,.docx,.txt,.md,.csv,.json,image/*"
            onChange={handleFileChange}
          />
        </label>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
        {documents.length === 0 && (
          <p className="mt-6 text-center text-sm text-neutral-400">尚未上傳任何文件</p>
        )}

        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start justify-between gap-2 rounded-xl bg-neutral-100 px-3 py-2 text-sm dark:bg-neutral-800"
          >
            <div className="min-w-0">
              <p className="truncate font-medium" title={doc.fileName}>
                {doc.fileName}
              </p>
              <p className="text-xs text-neutral-500">
                {formatSize(doc.size)} · {doc.chunkCount} 段落
              </p>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              className="shrink-0 text-xs text-red-500 hover:underline"
            >
              刪除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
