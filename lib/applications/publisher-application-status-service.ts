import { createAdminClient } from "@/lib/supabase/admin";

export const PUBLISHER_APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
] as const;

export type PublisherApplicationStatus =
  (typeof PUBLISHER_APPLICATION_STATUSES)[number];

type AdminClient = ReturnType<typeof createAdminClient>;

type AcceptedApplicationContext = {
  applicationId: string | number;
  opportunityId: string | number;
  publisherId: string | number;
  talentId: string | number;
};

export type PublisherApplicationStatusResult = {
  applicationId: string | number;
  opportunityId: string | number;
  postingMode: string | null;
  status: PublisherApplicationStatus;
  conversationId: number | null;
  changed: boolean;
};

export function isPublisherApplicationStatus(
  status: string,
): status is PublisherApplicationStatus {
  return PUBLISHER_APPLICATION_STATUSES.includes(
    status as PublisherApplicationStatus,
  );
}

function normalizeApplicationStatus(
  status: string | null | undefined,
): PublisherApplicationStatus {
  return status && isPublisherApplicationStatus(status)
    ? status
    : "pending";
}

function getNotificationMessage(
  status: PublisherApplicationStatus,
  opportunityTitle?: string | null,
) {
  const title = opportunityTitle ? `: ${opportunityTitle}` : "";
  const messages: Record<PublisherApplicationStatus, string> = {
    pending: `Your application is pending${title}`,
    reviewing: `Your application is under review${title}`,
    shortlisted: `You have been shortlisted for the opportunity${title}`,
    accepted: `Your application has been accepted${title}. You can now start a conversation with the publisher.`,
    rejected: `Your application has been rejected${title}`,
  };
  return messages[status];
}

const validTransitions: Record<
  PublisherApplicationStatus,
  PublisherApplicationStatus[]
> = {
  pending: ["accepted", "rejected"],
  reviewing: ["accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

async function logStatusChange(
  adminClient: AdminClient,
  applicationId: string | number,
  oldStatus: PublisherApplicationStatus,
  newStatus: PublisherApplicationStatus,
  userId: string,
) {
  const { error } = await adminClient
    .from("application_status_logs")
    .insert({
      application_id: applicationId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userId,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Application status log error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

async function updateEngagement(
  adminClient: AdminClient,
  talentId: string | number,
  status: PublisherApplicationStatus,
) {
  const { error } = await adminClient
    .from("talent_engagement_score")
    .upsert({
      talent_id: talentId,
      last_status: status,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Talent engagement update error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

async function ensureAcceptedConversation(
  adminClient: AdminClient,
  context: AcceptedApplicationContext,
) {
  const { applicationId, opportunityId, publisherId, talentId } = context;

  const { data: existingConversation, error: lookupError } = await adminClient
    .from("conversations")
    .select("id, status")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Failed to check the application conversation: ${lookupError.message}`,
    );
  }

  if (existingConversation) return Number(existingConversation.id);

  const now = new Date().toISOString();
  const { data: createdConversation, error: createError } = await adminClient
    .from("conversations")
    .insert({
      application_id: applicationId,
      opportunity_id: opportunityId,
      publisher_id: publisherId,
      talent_id: talentId,
      status: "active",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (!createError && createdConversation) {
    return Number(createdConversation.id);
  }

  if (createError?.code === "23505") {
    const { data: concurrentConversation, error: retryError } = await adminClient
      .from("conversations")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (!retryError && concurrentConversation) {
      return Number(concurrentConversation.id);
    }
  }

  throw new Error(
    `Failed to create the accepted application conversation: ${createError?.message ?? "Unknown error"}`,
  );
}

async function createCanonicalNotification({
  adminClient,
  eventType,
  targetType,
  targetId,
  actorId,
  recipientType,
  recipientId,
  title,
  body,
  metadata,
}: {
  adminClient: AdminClient;
  eventType: string;
  targetType: string;
  targetId: string;
  actorId: string;
  recipientType: "talent" | "publisher";
  recipientId: string | number;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: event, error: eventError } = await adminClient
    .from("events")
    .insert({
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      actor_id: actorId,
      metadata: metadata ?? {},
    })
    .select("id")
    .single();

  if (eventError || !event) {
    console.error("Failed to create notification event:", eventError);
    return;
  }

  const { error: notificationError } = await adminClient
    .from("notifications")
    .insert({
      event_id: event.id,
      recipient_type: recipientType,
      recipient_id: String(recipientId),
      title,
      body,
      is_read: false,
    });

  if (notificationError) {
    console.error("Failed to create canonical notification:", notificationError);
  }
}

export async function updatePublisherApplicationStatus(input: {
  userId: string;
  applicationId: string | number;
  status: PublisherApplicationStatus;
}): Promise<PublisherApplicationStatusResult> {
  const { userId, applicationId, status } = input;
  if (!applicationId) throw new Error("Application ID is required.");

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, account_type, approval_status, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) throw new Error("Profile not found.");
  if (profile.account_type !== "publisher") {
    throw new Error("Publisher access required.");
  }
  if (profile.approval_status !== "approved") {
    throw new Error("Publisher account is not approved.");
  }
  if (["suspended", "blocked", "banned", "disabled"].includes(String(profile.status))) {
    throw new Error("Publisher account is not active.");
  }

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }
  if (["suspended", "blocked", "banned", "disabled"].includes(String(publisher.status))) {
    throw new Error("Publisher account is not active.");
  }

  const { data: application, error: applicationError } = await adminClient
    .from("opportunity_applications")
    .select("id, opportunity_id, talent_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    throw new Error("Application not found.");
  }

  const { data: opportunity, error: opportunityError } = await adminClient
    .from("opportunities")
    .select("id, title, publisher_id, opportunity_type, posting_mode")
    .eq("id", application.opportunity_id)
    .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error("Opportunity not found.");
  }
  if (opportunity.publisher_id !== publisher.id) {
    throw new Error("Access denied.");
  }

  const currentStatus = normalizeApplicationStatus(application.status);

  if (currentStatus === status) {
    const conversationId =
      status === "accepted"
        ? await ensureAcceptedConversation(adminClient, {
            applicationId: application.id,
            opportunityId: application.opportunity_id,
            publisherId: publisher.id,
            talentId: application.talent_id,
          })
        : null;

    return {
      applicationId: application.id,
      opportunityId: application.opportunity_id,
      postingMode: opportunity.posting_mode,
      status,
      conversationId,
      changed: false,
    };
  }

  if (!validTransitions[currentStatus].includes(status)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${status}.`);
  }

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, user_id, primary_role, category_slug")
    .eq("id", application.talent_id)
    .maybeSingle();

  if (talentError || !talent?.user_id) {
    throw new Error("Talent user account not found.");
  }

  if (status === "accepted") {
    const opportunityRole = String(opportunity.opportunity_type ?? "")
      .trim()
      .toLowerCase();
    const talentRole = String(talent.primary_role ?? talent.category_slug ?? "")
      .trim()
      .toLowerCase();
    if (
      (opportunityRole === "actor" || opportunityRole === "model") &&
      talentRole !== opportunityRole
    ) {
      throw new Error(
        "This application cannot be accepted because the Talent role does not match the opportunity.",
      );
    }
  }

  const now = new Date().toISOString();
  const { data: updatedApplication, error: updateError } = await adminClient
    .from("opportunity_applications")
    .update({ status, updated_at: now })
    .eq("id", application.id)
    .eq("opportunity_id", application.opportunity_id)
    .eq("status", application.status)
    .select("id")
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (!updatedApplication) {
    throw new Error(
      "Application status changed before the update could complete.",
    );
  }

  await logStatusChange(
    adminClient,
    application.id,
    currentStatus,
    status,
    userId,
  );

  const conversationId =
    status === "accepted"
      ? await ensureAcceptedConversation(adminClient, {
          applicationId: application.id,
          opportunityId: application.opportunity_id,
          publisherId: publisher.id,
          talentId: application.talent_id,
        })
      : null;

  const isQuickRequest = opportunity.posting_mode === "quick";

  if (status === "accepted" || status === "rejected") {
    const isQuickSelection = isQuickRequest && status === "accepted";

    await createCanonicalNotification({
      adminClient,
      eventType: "application_status_changed",
      targetType: "application",
      targetId: String(application.id),
      actorId: userId,
      recipientType: "talent",
      recipientId: application.talent_id,
      title: isQuickSelection
        ? "تم اختيارك لهذا الطلب"
        : status === "accepted"
          ? "تم قبول طلبك"
          : "تحديث على طلبك",
      body: isQuickSelection
        ? `اختارك الناشر مبدئيًا لطلب «${opportunity.title ?? "طلب سريع"}». افتح المحادثة لمتابعة الأعمال أو المعلومات المطلوبة قبل تأكيد التعاون.`
        : getNotificationMessage(status, opportunity.title),
      metadata: {
        applicationId: application.id,
        opportunityId: application.opportunity_id,
        conversationId,
        status,
        postingMode: opportunity.posting_mode,
      },
    });
  }

  if (status === "accepted" && conversationId) {
    await createCanonicalNotification({
      adminClient,
      eventType: isQuickRequest
        ? "quick_request_selection_started"
        : "booking_ready",
      targetType: "conversation",
      targetId: String(conversationId),
      actorId: userId,
      recipientType: "publisher",
      recipientId: publisher.id,
      title: isQuickRequest
        ? "تم الاختيار المبدئي — أكمل عبر المحادثة"
        : "تم قبول الموهبة — أكمل تفاصيل الحجز",
      body: isQuickRequest
        ? "ابدأ المحادثة واطلب الأعمال أو المعلومات اللازمة قبل تأكيد اختيار الموهبة نهائيًا."
        : "أرسل للموهبة تاريخ العمل والوقت والموقع والمقابل لتأكيد الحجز.",
      metadata: {
        applicationId: application.id,
        opportunityId: application.opportunity_id,
        conversationId,
        postingMode: opportunity.posting_mode,
      },
    });
  }

  await updateEngagement(adminClient, application.talent_id, status);

  return {
    applicationId: application.id,
    opportunityId: application.opportunity_id,
    postingMode: opportunity.posting_mode,
    status,
    conversationId,
    changed: true,
  };
}
