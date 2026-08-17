import { createJsonFileStore } from "@/lib/jsonFileStore";
import type { KbChunk, KbDocument, KbStoreData } from "@/lib/kb/types";

const store = createJsonFileStore<KbStoreData>("kb-store.json", {
  documents: [],
  chunks: [],
});

export function listDocuments(): Promise<KbDocument[]> {
  return store.transact((data) => data.documents);
}

export function addDocument(
  document: KbDocument,
  chunks: KbChunk[]
): Promise<KbDocument> {
  return store.transactAndSave((data) => {
    data.documents.push(document);
    data.chunks.push(...chunks);
    return document;
  });
}

export function deleteDocument(id: string): Promise<boolean> {
  return store.transactAndSave((data) => {
    const existed = data.documents.some((doc) => doc.id === id);
    data.documents = data.documents.filter((doc) => doc.id !== id);
    data.chunks = data.chunks.filter((chunk) => chunk.documentId !== id);
    return existed;
  });
}

export function getAllChunks(): Promise<KbChunk[]> {
  return store.transact((data) => data.chunks);
}
