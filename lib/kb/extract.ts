import { extractImageText } from "@/lib/kb/extractImage";

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".json"]);

export class UnsupportedFileTypeError extends Error {}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

/** Extracts plain text from an uploaded file so it can be chunked and embedded. */
export async function extractText(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const ext = extensionOf(fileName);

  if (mimeType === "application/pdf" || ext === ".pdf") {
    const { default: pdfParse } = await import("pdf-parse");
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType.startsWith("image/")) {
    return extractImageText(buffer, mimeType);
  }

  if (TEXT_MIME_TYPES.has(mimeType) || TEXT_EXTENSIONS.has(ext)) {
    return buffer.toString("utf-8");
  }

  throw new UnsupportedFileTypeError(
    `Unsupported file type: ${mimeType || ext || "unknown"}`
  );
}
