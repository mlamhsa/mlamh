import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import {
  getUserConversationDetail,
  sendUserMessage,
} from "@/lib/messages/user-conversation-detail";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const data = await getUserConversationDetail(auth.user.id, Number(id));

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
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const conversationId = Number(id);

  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return NextResponse.json(
      { ok: false, code: "INVALID_CONVERSATION" },
      { status: 400 },
    );
  }

  try {
    const rate = await consumeServerRateLimit({
      namespace: "conversation-message",
      identifier: `${auth.user.id}:${conversationId}`,
      limit: 30,
      windowSeconds: 60,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
  } catch (error) {
    console.error("[api.conversations.message.rateLimit]", error);
    return NextResponse.json(
      { ok: false, code: "RATE_LIMIT_UNAVAILABLE" },
      { status: 503 },
    );
  }

  let payload: { body?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const result = await sendUserMessage(
    auth.user.id,
    conversationId,
    payload.body,
  );

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
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
