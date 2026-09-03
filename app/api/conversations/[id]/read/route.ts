import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { markUserConversationRead } from "@/lib/messages/user-conversation-detail";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await context.params;
  const result = await markUserConversationRead(auth.user.id, Number(id));
  if (!result.ok) return NextResponse.json(result, { status: result.code === "NOT_FOUND" ? 404 : 500 });
  return NextResponse.json(result);
}
