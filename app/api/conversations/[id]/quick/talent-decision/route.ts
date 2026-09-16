import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { respondToQuickRequestAsTalent } from "@/lib/quick-requests/talent-decision-service";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

function statusFor(code: string) {
  if (code === "INVALID_CONVERSATION" || code === "INVALID_DECISION") return 400;
  if (code === "NOT_TALENT" || code === "ACCOUNT_RESTRICTED") return 403;
  if (code === "CONVERSATION_NOT_FOUND") return 404;
  if (
    code === "CONVERSATION_NOT_ACTIVE" ||
    code === "NOT_QUICK_REQUEST" ||
    code === "PRELIMINARY_SELECTION_REQUIRED" ||
    code === "PUBLISHER_CONFIRMATION_REQUIRED" ||
    code === "ALREADY_DECIDED"
  ) return 409;
  return 500;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const { id } = await context.params;
  const conversationId = Number(id);

  let payload: { decision?: unknown; locale?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const decision = payload.decision === "accept" || payload.decision === "decline" ? payload.decision : null;
  if (!decision) return NextResponse.json({ ok: false, code: "INVALID_DECISION" }, { status: 400 });
  const locale = payload.locale === "en" ? "en" : "ar";

  try {
    const rate = await consumeServerRateLimit({
      namespace: "quick-talent-decision",
      identifier: `${auth.user.id}:${conversationId}`,
      limit: 6,
      windowSeconds: 600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("[api.quick-talent-decision.rateLimit]", error);
    return NextResponse.json({ ok: false, code: "RATE_LIMIT_UNAVAILABLE" }, { status: 503 });
  }

  const result = await respondToQuickRequestAsTalent({
    userId: auth.user.id,
    conversationId,
    decision,
    locale,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : statusFor(result.code) });
}
