export type KbDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  createdAt: string;
};

export type KbChunk = {
  id: string;
  documentId: string;
  index: number;
  text: string;
  embedding: number[];
};

export type KbStoreData = {
  documents: KbDocument[];
  chunks: KbChunk[];
};
