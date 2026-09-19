import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import {
  requestQuickMaterialsForPublisher,
  type QuickMaterialRequestType,
} from "@/lib/quick-requests/native-publisher-workflow";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

const VALID_TYPES = new Set<QuickMaterialRequestType>([
  "portfolio",
  "intro_video",
  "measurements",
  "availability",
]);

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

  let payload: { requestType?: unknown; note?: unknown; locale?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const requestType = String(payload.requestType ?? "") as QuickMaterialRequestType;
  if (!VALID_TYPES.has(requestType)) {
    return NextResponse.json({ ok: false, code: "INVALID_MATERIAL_TYPE" }, { status: 400 });
  }

  const locale = payload.locale === "en" ? "en" : "ar";
  const note = typeof payload.note === "string" ? payload.note : "";

  try {
    const rate = await consumeServerRateLimit({
      namespace: "quick-material-request",
      identifier: `${auth.user.id}:${conversationId}`,
      limit: 12,
      windowSeconds: 60,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    console.error("[api.quick.materials.rateLimit]", error);
    return NextResponse.json({ ok: false, code: "RATE_LIMIT_UNAVAILABLE" }, { status: 503 });
  }

  try {
    const result = await requestQuickMaterialsForPublisher({
      userId: auth.user.id,
      conversationId,
      requestType,
      note,
      locale,
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "CONVERSATION_NOT_ACTIVE" || result.code === "PRELIMINARY_SELECTION_REQUIRED"
            ? 409
            : result.code === "INSERT_FAILED"
              ? 500
              : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: result.code === "CREATED" ? 201 : 200 });
  } catch (error) {
    console.error("[api.quick.materials]", error);
    return NextResponse.json({ ok: false, code: "QUICK_WORKFLOW_FAILED" }, { status: 500 });
  }
}
