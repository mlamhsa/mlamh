import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_EVENT_NAMES = new Set([
  "page_view",
  "signup",
  "profile_completed",
  "application_submitted",
]);

const MARKETING_EVENT_LIMIT = 120;
const MARKETING_EVENT_WINDOW_SECONDS = 60;

function cleanText(value: unknown, maxLength = 255) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function anonymousRateLimitIdentifier(request: Request, anonymousSessionId: string | null) {
  // Vercel overwrites x-forwarded-for at the edge, so the production value is
  // not accepted verbatim from an untrusted external client. Hash it before
  // storage so the rate-limit table never needs the raw client IP.
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim();
  const clientIp = forwardedFor?.split(",")[0]?.trim();

  if (clientIp) return `ip:${hashIdentifier(clientIp)}`;
  if (anonymousSessionId) return `session:${hashIdentifier(anonymousSessionId)}`;
  return "anonymous:unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = cleanText(body?.event_name, 80);

    if (!eventName || !ALLOWED_EVENT_NAMES.has(eventName)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const anonymousSessionId = cleanText(body?.anonymous_session_id, 120);
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    const identifier = user?.id
      ? `user:${user.id}`
      : anonymousRateLimitIdentifier(request, anonymousSessionId);

    try {
      const rateLimit = await consumeServerRateLimit({
        namespace: "marketing-event",
        identifier,
        limit: MARKETING_EVENT_LIMIT,
        windowSeconds: MARKETING_EVENT_WINDOW_SECONDS,
      });

      if (!rateLimit.allowed) {
        return NextResponse.json(
          { ok: false, code: "RATE_LIMITED" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(1, rateLimit.retryAfterSeconds)),
            },
          },
        );
      }
    } catch (rateLimitError) {
      console.error("[marketing/events] rate limit failed", rateLimitError);
      return NextResponse.json(
        { ok: false, code: "RATE_LIMIT_UNAVAILABLE" },
        { status: 503 },
      );
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("marketing_events").insert({
      event_name: eventName,
      user_id: user?.id ?? null,
      anonymous_session_id: anonymousSessionId,
      source: cleanText(body?.source, 120),
      medium: cleanText(body?.medium, 120),
      campaign: cleanText(body?.campaign, 160),
      content: cleanText(body?.content, 160),
      term: cleanText(body?.term, 160),
      referrer: cleanText(body?.referrer, 500),
      entity_type: cleanText(body?.entity_type, 80),
      entity_id: cleanText(body?.entity_id, 160),
      metadata:
        body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
          ? body.metadata
          : {},
      occurred_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[marketing/events] insert failed", error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
