import { NextResponse } from "next/server";
import {
  deleteConversation,
  getConversation,
  renameConversation,
} from "@/lib/history/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const conversation = await getConversation(params.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { title } = await req.json();
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const conversation = await renameConversation(params.id, title);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const existed = await deleteConversation(params.id);
  if (!existed) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
