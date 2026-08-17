import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { KbChunk, KbDocument, KbStoreData } from "@/lib/kb/types";

const DATA_DIR = process.env.KB_DATA_DIR ?? path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "kb-store.json");

const EMPTY_STORE: KbStoreData = { documents: [], chunks: [] };

// Serializes reads/writes so concurrent requests can't clobber the JSON file.
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task);
  queue = result.catch(() => undefined);
  return result;
}

async function load(): Promise<KbStoreData> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as KbStoreData;
  } catch (err: any) {
    if (err?.code === "ENOENT") return { ...EMPTY_STORE };
    throw err;
  }
}

async function save(data: KbStoreData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(data), "utf-8");
}

export function listDocuments(): Promise<KbDocument[]> {
  return enqueue(async () => (await load()).documents);
}

export function addDocument(
  document: KbDocument,
  chunks: KbChunk[]
): Promise<KbDocument> {
  return enqueue(async () => {
    const data = await load();
    data.documents.push(document);
    data.chunks.push(...chunks);
    await save(data);
    return document;
  });
}

export function deleteDocument(id: string): Promise<boolean> {
  return enqueue(async () => {
    const data = await load();
    const existed = data.documents.some((doc) => doc.id === id);
    data.documents = data.documents.filter((doc) => doc.id !== id);
    data.chunks = data.chunks.filter((chunk) => chunk.documentId !== id);
    await save(data);
    return existed;
  });
}

export function getAllChunks(): Promise<KbChunk[]> {
  return enqueue(async () => (await load()).chunks);
}

export function hasAnyChunks(): Promise<boolean> {
  return enqueue(async () => (await load()).chunks.length > 0);
}
