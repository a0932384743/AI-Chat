import { NextResponse } from "next/server";
import { createConversation, listConversations } from "@/lib/history/store";

export const runtime = "nodejs";

export async function GET() {
  const conversations = await listConversations();
  return NextResponse.json({ conversations });
}

export async function POST() {
  const conversation = await createConversation();
  return NextResponse.json({ conversation }, { status: 201 });
}
