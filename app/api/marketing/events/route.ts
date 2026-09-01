import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_EVENT_NAMES = new Set([
  "page_view",
  "signup",
  "profile_completed",
  "application_submitted",
]);

function cleanText(value: unknown, maxLength = 255) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventName = cleanText(body?.event_name, 80);

    if (!eventName || !ALLOWED_EVENT_NAMES.has(eventName)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    const adminClient = createAdminClient();
    const { error } = await adminClient.from("marketing_events").insert({
      event_name: eventName,
      user_id: user?.id ?? null,
      anonymous_session_id: cleanText(body?.anonymous_session_id, 120),
      source: cleanText(body?.source, 120),
      medium: cleanText(body?.medium, 120),
      campaign: cleanText(body?.campaign, 160),
      content: cleanText(body?.content, 160),
      term: cleanText(body?.term, 160),
      referrer: cleanText(body?.referrer, 500),
      entity_type: cleanText(body?.entity_type, 80),
      entity_id: cleanText(body?.entity_id, 160),
      metadata:
        body?.metadata && typeof body.metadata === "object"
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
