import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type NotificationRecord = {
  read_at?: string | null;
  is_read?: boolean | null;
};

function isNotificationUnread(notification: NotificationRecord) {
  if (typeof notification.is_read === "boolean") return notification.is_read === false;
  if ("read_at" in notification) return notification.read_at === null;
  return false;
}

function emptyResponse(status: number) {
  return NextResponse.json(
    {
      publisherId: null,
      publisherType: null,
      workspaceEligible: false,
      applicants: 0,
      messages: 0,
      notifications: 0,
    },
    { status },
  );
}

export async function GET() {
  const authClient = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) return emptyResponse(401);

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== "publisher") return emptyResponse(403);

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id, publisher_type")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) return emptyResponse(404);

  const publisherType = String(publisher.publisher_type ?? "individual");
  const workspaceEligible = publisherType !== "individual";

  const { data: publisherOpportunities, error: opportunitiesError } = await adminClient
    .from("opportunities")
    .select("id")
    .eq("publisher_id", publisher.id);

  if (opportunitiesError) console.error("[PublisherDashboardCounts opportunities]", opportunitiesError);
  const opportunityIds = (publisherOpportunities ?? []).map((opportunity) => opportunity.id);

  const { data: applicantRows, error: applicantsError } = opportunityIds.length > 0
    ? await adminClient.from("opportunity_applications").select("id, status").in("opportunity_id", opportunityIds)
    : { data: [], error: null };

  if (applicantsError) console.error("[PublisherDashboardCounts applicants]", applicantsError);
  const pendingApplicants = applicantsError
    ? 0
    : (applicantRows ?? []).filter((application) => application.status !== "accepted" && application.status !== "rejected").length;

  const { data: conversations, error: conversationsError } = await adminClient
    .from("conversations")
    .select("id")
    .eq("publisher_id", publisher.id);

  if (conversationsError) {
    console.error("[PublisherDashboardCounts conversations]", conversationsError);
    return NextResponse.json(
      { publisherId: publisher.id, publisherType, workspaceEligible, applicants: pendingApplicants, messages: 0, notifications: 0 },
      { status: 500 },
    );
  }

  const conversationIds = (conversations ?? []).map((conversation) => conversation.id);
  const [messagesResult, notificationsResult] = await Promise.all([
    conversationIds.length > 0
      ? adminClient.from("messages").select("id").in("conversation_id", conversationIds).neq("sender_user_id", user.id).is("read_at", null)
      : Promise.resolve({ data: [], error: null }),
    adminClient.from("notifications").select("*").eq("recipient_type", "publisher").eq("recipient_id", publisher.id),
  ]);

  if (messagesResult.error) console.error("[PublisherDashboardCounts messages]", messagesResult.error);
  if (notificationsResult.error) console.error("[PublisherDashboardCounts notifications]", notificationsResult.error);

  const unreadMessages = messagesResult.error ? 0 : (messagesResult.data ?? []).length;
  const unreadNotifications = notificationsResult.error
    ? 0
    : ((notificationsResult.data ?? []) as NotificationRecord[]).filter(isNotificationUnread).length;

  return NextResponse.json({
    publisherId: publisher.id,
    publisherType,
    workspaceEligible,
    applicants: pendingApplicants,
    messages: unreadMessages,
    notifications: unreadNotifications,
  });
}
