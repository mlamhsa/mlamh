import { NextResponse } from "next/server";

import { isValidLocale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    locale: string;
    notificationId: string;
  }>;
};

type EventRecord = {
  event_type: string | null;
  metadata: Record<string, unknown> | null;
};

type NotificationRecord = {
  id: number;
  is_read: boolean | null;
  events: EventRecord | EventRecord[] | null;
};

function getRelatedEvent(value: NotificationRecord["events"]): EventRecord | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getPositiveInteger(
  metadata: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = Number(metadata?.[key]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function getPublicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? requestUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

const BOOKING_EVENTS = new Set([
  "booking_proposed",
  "booking_updated",
  "booking_confirmed",
  "booking_changes_requested",
  "booking_completion_confirmed",
  "booking_completed",
]);

export async function GET(request: Request, { params }: RouteProps) {
  const { locale: localeParam, notificationId } = await params;
  const locale = isValidLocale(localeParam) ? localeParam : "ar";
  const origin = getPublicOrigin(request);
  const fallback = new URL(`/${locale}/publisher-dashboard/notifications`, origin);
  const id = Number(notificationId);

  if (!Number.isInteger(id) || id <= 0) return NextResponse.redirect(fallback);

  const auth = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await auth.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL(`/${locale}/login`, origin));

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.account_type !== "publisher") return NextResponse.redirect(fallback);

  const { data: publisher } = await admin
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher) return NextResponse.redirect(fallback);

  const { data: notification, error: notificationError } = await admin
    .from("notifications")
    .select(`
      id,
      is_read,
      events (
        event_type,
        metadata
      )
    `)
    .eq("id", id)
    .eq("recipient_type", "publisher")
    .eq("recipient_id", String(publisher.id))
    .maybeSingle();

  if (notificationError || !notification) {
    if (notificationError) console.error("[publisher-notification-route]", notificationError);
    return NextResponse.redirect(fallback);
  }

  const typed = notification as NotificationRecord;
  if (typed.is_read !== true) {
    await admin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("recipient_type", "publisher")
      .eq("recipient_id", String(publisher.id));
  }

  const event = getRelatedEvent(typed.events);
  if (!event?.event_type || !BOOKING_EVENTS.has(event.event_type)) {
    return NextResponse.redirect(fallback);
  }

  const conversationId = getPositiveInteger(event.metadata, "conversationId");
  if (!conversationId) return NextResponse.redirect(fallback);

  const { data: conversation } = await admin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (!conversation) return NextResponse.redirect(fallback);

  return NextResponse.redirect(new URL(`/${locale}/booking/${conversation.id}`, origin));
}
