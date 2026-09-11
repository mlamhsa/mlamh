import { NextResponse } from "next/server";

import { isValidLocale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ locale: string; notificationId: string }>;
};

type EventRecord = {
  event_type: string | null;
  metadata: Record<string, unknown> | null;
};

type NotificationRecord = {
  id: number;
  recipient_type: string | null;
  recipient_id: string | null;
  is_read: boolean | null;
  events: EventRecord | EventRecord[] | null;
};

type OpportunityRecord = {
  id: number;
  slug: string | null;
  published: boolean | null;
  status: string | null;
};

type InvitationRecord = {
  id: number;
  status: string | null;
  opportunity_id: number;
  opportunities: OpportunityRecord | OpportunityRecord[] | null;
};

const BOOKING_EVENTS = new Set([
  "booking_proposed",
  "booking_updated",
  "booking_confirmed",
  "booking_changes_requested",
  "booking_completion_confirmed",
  "booking_completed",
  "managed_casting_booking_proposed",
  "managed_booking_confirmed",
  "managed_booking_changes_requested",
  "managed_booking_talent_completed",
  "managed_booking_completed",
]);

function relatedEvent(value: NotificationRecord["events"]): EventRecord | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function positiveInteger(metadata: Record<string, unknown> | null, key: string) {
  const value = Number(metadata?.[key]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function relatedOpportunity(value: InvitationRecord["opportunities"]): OpportunityRecord | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function publicOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? requestUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function opportunityIsAvailable(opportunity: OpportunityRecord | null) {
  return Boolean(
    opportunity?.slug &&
    opportunity.published === true &&
    ["published", "open"].includes(opportunity.status ?? ""),
  );
}

export async function GET(request: Request, { params }: RouteProps) {
  const { locale: localeParam, notificationId } = await params;
  const locale = isValidLocale(localeParam) ? localeParam : "ar";
  const origin = publicOrigin(request);
  const fallbackUrl = new URL(`/${locale}/talent-dashboard/notifications`, origin);
  const id = Number(notificationId);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.redirect(fallbackUrl);

  const auth = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await auth.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL(`/${locale}/login`, origin));

  const admin = createAdminClient();
  const { data: talent, error: talentError } = await admin.from("talents").select("id").eq("user_id", user.id).maybeSingle();
  if (talentError || !talent) {
    if (talentError) console.error("[notification-route:talent]", talentError);
    return NextResponse.redirect(fallbackUrl);
  }

  const { data: notification, error: notificationError } = await admin
    .from("notifications")
    .select(`id,recipient_type,recipient_id,is_read,events(event_type,metadata)`)
    .eq("id", id)
    .eq("recipient_type", "talent")
    .eq("recipient_id", String(talent.id))
    .maybeSingle();

  if (notificationError || !notification) {
    if (notificationError) console.error("[notification-route:notification]", notificationError);
    return NextResponse.redirect(fallbackUrl);
  }

  const typedNotification = notification as NotificationRecord;
  if (typedNotification.is_read !== true) {
    const { error: readError } = await admin.from("notifications")
      .update({ is_read: true })
      .eq("id", typedNotification.id)
      .eq("recipient_type", "talent")
      .eq("recipient_id", String(talent.id));
    if (readError) console.error("[notification-route:mark-read]", readError);
  }

  const event = relatedEvent(typedNotification.events);
  if (event?.event_type && BOOKING_EVENTS.has(event.event_type)) {
    const conversationId = positiveInteger(event.metadata, "conversationId");
    if (!conversationId) return NextResponse.redirect(fallbackUrl);
    const { data: conversation } = await admin.from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("talent_id", talent.id)
      .maybeSingle();
    if (!conversation) return NextResponse.redirect(fallbackUrl);
    return NextResponse.redirect(new URL(`/${locale}/booking/${conversation.id}`, origin));
  }

  if (event?.event_type === "managed_casting_invitation") {
    const invitationId = positiveInteger(event.metadata, "invitationId");
    if (!invitationId) return NextResponse.redirect(fallbackUrl);

    const { data: invitation, error: invitationError } = await admin
      .from("managed_casting_invitations")
      .select(`id,status,opportunity_id,opportunities(id,slug,published,status)`)
      .eq("id", invitationId)
      .eq("talent_id", talent.id)
      .maybeSingle();

    if (invitationError || !invitation) {
      if (invitationError) console.error("[notification-route:managed-invitation-lookup]", invitationError);
      return NextResponse.redirect(fallbackUrl);
    }

    const typedInvitation = invitation as InvitationRecord;
    if (typedInvitation.status === "sent") {
      const now = new Date().toISOString();
      const { error: updateError } = await admin.from("managed_casting_invitations")
        .update({ status: "viewed", viewed_at: now, updated_at: now })
        .eq("id", typedInvitation.id)
        .eq("talent_id", talent.id)
        .eq("status", "sent");
      if (updateError) console.error("[notification-route:managed-invitation-update]", updateError);
    }

    const opportunity = relatedOpportunity(typedInvitation.opportunities);
    if (!opportunityIsAvailable(opportunity) || !opportunity?.slug) return NextResponse.redirect(fallbackUrl);

    return NextResponse.redirect(
      new URL(`/${locale}/opportunities/${encodeURIComponent(opportunity.slug)}`, origin),
    );
  }

  if (event?.event_type !== "opportunity_invitation") return NextResponse.redirect(fallbackUrl);

  const invitationId = positiveInteger(event.metadata, "invitationId");
  if (!invitationId) return NextResponse.redirect(fallbackUrl);

  const { data: invitation, error: invitationError } = await admin
    .from("opportunity_invitations")
    .select(`id,status,opportunity_id,opportunities(id,slug,published,status)`)
    .eq("id", invitationId)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (invitationError || !invitation) {
    if (invitationError) console.error("[notification-route:invitation-lookup]", invitationError);
    return NextResponse.redirect(fallbackUrl);
  }

  const typedInvitation = invitation as InvitationRecord;
  if (typedInvitation.status === "sent") {
    const { error: updateError } = await admin.from("opportunity_invitations")
      .update({ status: "viewed", read_at: new Date().toISOString() })
      .eq("id", typedInvitation.id)
      .eq("talent_id", talent.id)
      .eq("status", "sent");
    if (updateError) console.error("[notification-route:invitation-update]", updateError);
  }

  const opportunity = relatedOpportunity(typedInvitation.opportunities);
  if (!opportunityIsAvailable(opportunity) || !opportunity?.slug) return NextResponse.redirect(fallbackUrl);

  return NextResponse.redirect(
    new URL(`/${locale}/opportunities/${encodeURIComponent(opportunity.slug)}`, origin),
  );
}
