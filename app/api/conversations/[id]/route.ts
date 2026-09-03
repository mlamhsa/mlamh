import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import {
  getTalentConversationDetail,
  sendTalentMessage,
} from "@/lib/messages/talent-conversation-detail";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversationId = Number(id);
  const data = await getTalentConversationDetail(auth.user.id, conversationId);

  if (!data) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversationId = Number(id);

  let payload: { body?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const result = await sendTalentMessage(auth.user.id, conversationId, payload.body);

  if (!result.ok) {
    const status = result.code === "NOT_FOUND"
      ? 404
      : result.code === "CONVERSATION_NOT_ACTIVE"
        ? 409
        : result.code === "INSERT_FAILED"
          ? 500
          : 400;

    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
