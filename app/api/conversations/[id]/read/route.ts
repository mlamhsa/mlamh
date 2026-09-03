import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { markTalentConversationRead } from "@/lib/messages/mark-conversation-read";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const { id } = await context.params;
  const result = await markTalentConversationRead(auth.user.id, Number(id));
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : result.code === "UPDATE_FAILED" ? 500 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
