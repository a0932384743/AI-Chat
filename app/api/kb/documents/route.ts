import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { chunkText } from "@/lib/kb/chunk";
import { embedTexts } from "@/lib/kb/embeddings";
import { extractText, UnsupportedFileTypeError } from "@/lib/kb/extract";
import { addDocument, listDocuments } from "@/lib/kb/store";
import type { KbChunk, KbDocument } from "@/lib/kb/types";

export const runtime = "nodejs";

const MAX_FILE_SIZE_MB = Number(process.env.KB_MAX_FILE_SIZE_MB ?? 15);

export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json({ documents });
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_FILE_SIZE_MB}MB limit` },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractText(buffer, file.name, file.type);
  } catch (err) {
    if (err instanceof UnsupportedFileTypeError) {
      return NextResponse.json({ error: err.message }, { status: 415 });
    }
    console.error("KB extraction failed", err);
    return NextResponse.json(
      { error: "Failed to extract text from file" },
      { status: 500 }
    );
  }

  const pieces = chunkText(text);
  if (pieces.length === 0) {
    return NextResponse.json(
      { error: "No extractable text found in file" },
      { status: 422 }
    );
  }

  let embeddings: number[][];
  try {
    embeddings = await embedTexts(pieces);
  } catch (err) {
    console.error("KB embedding failed", err);
    return NextResponse.json(
      { error: "Failed to embed document (check LITELLM_EMBEDDING_MODEL)" },
      { status: 502 }
    );
  }

  const documentId = randomUUID();
  const chunks: KbChunk[] = pieces.map((chunkedText, index) => ({
    id: randomUUID(),
    documentId,
    index,
    text: chunkedText,
    embedding: embeddings[index],
  }));

  const document: KbDocument = {
    id: documentId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    chunkCount: chunks.length,
    createdAt: new Date().toISOString(),
  };

  await addDocument(document, chunks);

  return NextResponse.json({ document }, { status: 201 });
}
