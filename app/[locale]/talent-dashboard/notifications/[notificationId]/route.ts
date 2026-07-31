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
  opportunities:
    | OpportunityRecord
    | OpportunityRecord[]
    | null;
};

function getRelatedEvent(
  value: NotificationRecord["events"],
): EventRecord | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getPositiveInteger(
  metadata: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = Number(metadata?.[key]);

  return Number.isInteger(value) && value > 0
    ? value
    : null;
}

function getRelatedOpportunity(
  value: InvitationRecord["opportunities"],
): OpportunityRecord | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getPublicOrigin(request: Request) {
  const requestUrl = new URL(request.url);

  const host =
    request.headers.get("host") ??
    request.headers.get("x-forwarded-host") ??
    requestUrl.host;

  const protocol =
    request.headers.get("x-forwarded-proto") ??
    requestUrl.protocol.replace(":", "");

  return `${protocol}://${host}`;
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  const { locale: localeParam, notificationId } =
    await params;

    const locale = isValidLocale(localeParam)
    ? localeParam
    : "ar";
  
  const publicOrigin = getPublicOrigin(request);
  
  const fallbackUrl = new URL(
    `/${locale}/talent-dashboard/notifications`,
    publicOrigin,
  );

  const parsedNotificationId = Number(notificationId);

  if (
    !Number.isInteger(parsedNotificationId) ||
    parsedNotificationId <= 0
  ) {
    return NextResponse.redirect(fallbackUrl);
  }

  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(
      new URL(`/${locale}/login`, publicOrigin),
    );
  }

  const adminClient = createAdminClient();

  const {
    data: talent,
    error: talentError,
  } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    if (talentError) {
      console.error(
        "[notification-route:talent]",
        talentError,
      );
    }

    return NextResponse.redirect(fallbackUrl);
  }

  const {
    data: notification,
    error: notificationError,
  } = await adminClient
    .from("notifications")
    .select(`
      id,
      recipient_type,
      recipient_id,
      is_read,
      events (
        event_type,
        metadata
      )
    `)
    .eq("id", parsedNotificationId)
    .eq("recipient_type", "talent")
    .eq("recipient_id", String(talent.id))
    .maybeSingle();

  if (notificationError || !notification) {
    if (notificationError) {
      console.error(
        "[notification-route:notification]",
        notificationError,
      );
    }

    return NextResponse.redirect(fallbackUrl);
  }

  const typedNotification =
    notification as NotificationRecord;

  if (typedNotification.is_read !== true) {
    const { error: readError } = await adminClient
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", typedNotification.id)
      .eq("recipient_type", "talent")
      .eq("recipient_id", String(talent.id));

    if (readError) {
      console.error(
        "[notification-route:mark-read]",
        readError,
      );
    }
  }

  const event = getRelatedEvent(
    typedNotification.events,
  );

  if (
    event?.event_type !==
    "opportunity_invitation"
  ) {
    return NextResponse.redirect(fallbackUrl);
  }

  const invitationId = getPositiveInteger(
    event.metadata,
    "invitationId",
  );

  if (!invitationId) {
    return NextResponse.redirect(fallbackUrl);
  }

  const {
    data: invitation,
    error: invitationLookupError,
  } = await adminClient
    .from("opportunity_invitations")
    .select(`
      id,
      status,
      opportunity_id,
      opportunities (
        id,
        slug,
        published,
        status
      )
    `)
    .eq("id", invitationId)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (invitationLookupError || !invitation) {
    if (invitationLookupError) {
      console.error(
        "[notification-route:invitation-lookup]",
        invitationLookupError,
      );
    }

    return NextResponse.redirect(fallbackUrl);
  }

  const typedInvitation =
    invitation as InvitationRecord;

  if (typedInvitation.status === "sent") {
    const { error: invitationUpdateError } =
      await adminClient
        .from("opportunity_invitations")
        .update({
          status: "viewed",
          read_at: new Date().toISOString(),
        })
        .eq("id", typedInvitation.id)
        .eq("talent_id", talent.id)
        .eq("status", "sent");

    if (invitationUpdateError) {
      console.error(
        "[notification-route:invitation-update]",
        invitationUpdateError,
      );
    }
  }

  const relatedOpportunity =
    getRelatedOpportunity(
      typedInvitation.opportunities,
    );

  if (!relatedOpportunity?.slug) {
    return NextResponse.redirect(fallbackUrl);
  }

  const isAvailable =
    relatedOpportunity.published === true &&
    ["published", "open"].includes(
      relatedOpportunity.status ?? "",
    );

  if (!isAvailable) {
    return NextResponse.redirect(fallbackUrl);
  }

  const opportunityUrl = new URL(
    `/${locale}/opportunities/${encodeURIComponent(
      relatedOpportunity.slug,
    )}`,
    publicOrigin,
  );
  
  return NextResponse.redirect(opportunityUrl);
}