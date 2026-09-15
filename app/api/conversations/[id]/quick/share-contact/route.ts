import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { shareQuickContact } from "@/lib/messages/quick-contact-sharing";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

function failureStatus(code: string) {
  switch (code) {
    case "INVALID_CONVERSATION":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "CONVERSATION_NOT_ACTIVE":
    case "NOT_QUICK":
    case "PRELIMINARY_SELECTION_REQUIRED":
    case "MUTUAL_CONFIRMATION_REQUIRED":
    case "PHONE_MISSING":
      return 409;
    case "LOOKUP_FAILED":
    case "INSERT_FAILED":
    default:
      return 500;
  }
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
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return NextResponse.json({ ok: false, code: "INVALID_CONVERSATION" }, { status: 400 });
  }

  try {
    const rate = await consumeServerRateLimit({
      namespace: "quick-contact-share",
      identifier: `${auth.user.id}:${conversationId}`,
      limit: 5,
      windowSeconds: 600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("[api.quick.shareContact.rateLimit]", error);
    return NextResponse.json({ ok: false, code: "RATE_LIMIT_UNAVAILABLE" }, { status: 503 });
  }

  let locale: "ar" | "en" = "ar";
  try {
    const payload = await request.json();
    locale = payload?.locale === "en" ? "en" : "ar";
  } catch {
    // Locale is optional; Arabic is the safe default.
  }

  const result = await shareQuickContact({ userId: auth.user.id, conversationId, locale });
  if (!result.ok) {
    return NextResponse.json(result, { status: failureStatus(result.code) });
  }

  return NextResponse.json(result);
}
