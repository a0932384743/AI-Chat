import { NextResponse } from "next/server";
import { deleteDocument } from "@/lib/kb/store";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const existed = await deleteDocument(params.id);
  if (!existed) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
