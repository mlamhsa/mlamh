import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type QuickMaterialRequestType =
  | "portfolio"
  | "intro_video"
  | "measurements"
  | "availability";

type Locale = "ar" | "en";

type PublisherWorkflowContext = {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  conversation: {
    id: number;
    applicationId: number;
    opportunityId: number;
    publisherId: number;
    talentId: number;
  };
  opportunityTitle: string | null;
};

type WorkflowErrorCode =
  | "NOT_FOUND"
  | "CONVERSATION_NOT_ACTIVE"
  | "QUICK_ONLY"
  | "PRELIMINARY_SELECTION_REQUIRED"
  | "INVALID_MATERIAL_TYPE"
  | "INSERT_FAILED";

type WorkflowResult =
  | { ok: true; code: "CREATED" | "ALREADY_EXISTS" }
  | { ok: false; code: WorkflowErrorCode };

const MATERIAL_LABELS: Record<QuickMaterialRequestType, { ar: string; en: string }> = {
  portfolio: { ar: "معرض الأعمال", en: "portfolio" },
  intro_video: { ar: "فيديو تعريفي", en: "intro video" },
  measurements: { ar: "المقاسات / التفاصيل", en: "measurements / details" },
  availability: { ar: "التوفر للموعد", en: "availability" },
};

async function resolvePublisherWorkflowContext(
  userId: string,
  conversationId: number,
): Promise<PublisherWorkflowContext | WorkflowResult> {
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,account_type,approval_status,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    !profile ||
    profile.account_type !== "publisher" ||
    profile.approval_status !== "approved" ||
    isRestrictedAccountStatus(profile.status)
  ) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const { data: publisher } = await admin
    .from("publishers")
    .select("id,status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!publisher || isRestrictedAccountStatus(publisher.status)) {
    return { ok: false, code: "NOT_FOUND" };
  }

  const { data: conversation } = await admin
    .from("conversations")
    .select("id,application_id,opportunity_id,publisher_id,talent_id,conversation_type,status")
    .eq("id", conversationId)
    .eq("publisher_id", publisher.id)
    .eq("conversation_type", "publisher_talent")
    .maybeSingle();

  if (!conversation) return { ok: false, code: "NOT_FOUND" };
  if ((conversation.status ?? "active") !== "active") {
    return { ok: false, code: "CONVERSATION_NOT_ACTIVE" };
  }

  const { data: opportunity } = await admin
    .from("opportunities")
    .select("id,title,posting_mode")
    .eq("id", conversation.opportunity_id)
    .maybeSingle();

  if (!opportunity || opportunity.posting_mode !== "quick") {
    return { ok: false, code: "QUICK_ONLY" };
  }

  if (!conversation.application_id) {
    return { ok: false, code: "PRELIMINARY_SELECTION_REQUIRED" };
  }

  const { data: application } = await admin
    .from("opportunity_applications")
    .select("id,status")
    .eq("id", conversation.application_id)
    .eq("opportunity_id", conversation.opportunity_id)
    .eq("talent_id", conversation.talent_id)
    .maybeSingle();

  if (!application || application.status !== "accepted") {
    return { ok: false, code: "PRELIMINARY_SELECTION_REQUIRED" };
  }

  return {
    admin,
    userId,
    conversation: {
      id: Number(conversation.id),
      applicationId: Number(application.id),
      opportunityId: Number(conversation.opportunity_id),
      publisherId: Number(conversation.publisher_id),
      talentId: Number(conversation.talent_id),
    },
    opportunityTitle: opportunity.title,
  };
}

function isWorkflowResult(
  value: PublisherWorkflowContext | WorkflowResult,
): value is WorkflowResult {
  return "ok" in value;
}

async function eventExists(
  context: PublisherWorkflowContext,
  eventType: string,
  metadataContains?: Record<string, unknown>,
) {
  let query = context.admin
    .from("events")
    .select("id")
    .eq("event_type", eventType)
    .eq("target_type", "conversation")
    .eq("target_id", String(context.conversation.id))
    .limit(1);

  if (metadataContains) query = query.contains("metadata", metadataContains);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function createWorkflowMessage(input: {
  context: PublisherWorkflowContext;
  eventType: string;
  body: string;
  notificationTitle: string;
  notificationBody: string;
  metadata?: Record<string, unknown>;
}): Promise<WorkflowResult> {
  const { context } = input;
  const now = new Date().toISOString();
  const { data: message, error: messageError } = await context.admin
    .from("messages")
    .insert({
      conversation_id: context.conversation.id,
      sender_user_id: context.userId,
      body: input.body,
      read_at: null,
      created_at: now,
    })
    .select("id")
    .single();

  if (messageError || !message) return { ok: false, code: "INSERT_FAILED" };

  const { data: event, error: eventError } = await context.admin
    .from("events")
    .insert({
      event_type: input.eventType,
      target_type: "conversation",
      target_id: String(context.conversation.id),
      actor_id: context.userId,
      metadata: {
        conversationId: context.conversation.id,
        applicationId: context.conversation.applicationId,
        opportunityId: context.conversation.opportunityId,
        messageId: message.id,
        ...input.metadata,
      },
    })
    .select("id")
    .single();

  if (eventError || !event) {
    await context.admin
      .from("messages")
      .delete()
      .eq("id", message.id)
      .eq("conversation_id", context.conversation.id);
    return { ok: false, code: "INSERT_FAILED" };
  }

  const { error: notificationError } = await context.admin
    .from("notifications")
    .insert({
      event_id: event.id,
      recipient_type: "talent",
      recipient_id: String(context.conversation.talentId),
      title: input.notificationTitle,
      body: input.notificationBody,
      is_read: false,
      created_at: now,
    });
  if (notificationError) {
    console.error("[native publisher quick notification]", notificationError);
  }

  await context.admin
    .from("conversations")
    .update({ updated_at: now })
    .eq("id", context.conversation.id);

  return { ok: true, code: "CREATED" };
}

export async function requestQuickMaterialsForPublisher(input: {
  userId: string;
  conversationId: number;
  requestType: QuickMaterialRequestType;
  note?: string;
  locale: Locale;
}): Promise<WorkflowResult> {
  if (!Object.prototype.hasOwnProperty.call(MATERIAL_LABELS, input.requestType)) {
    return { ok: false, code: "INVALID_MATERIAL_TYPE" };
  }

  const resolved = await resolvePublisherWorkflowContext(
    input.userId,
    input.conversationId,
  );
  if (isWorkflowResult(resolved)) return resolved;

  if (
    await eventExists(resolved, "quick_request_materials_requested", {
      requestType: input.requestType,
    })
  ) {
    return { ok: true, code: "ALREADY_EXISTS" };
  }

  const note = (input.note ?? "").trim().slice(0, 500);
  const label = MATERIAL_LABELS[input.requestType][input.locale];
  const title = resolved.opportunityTitle || (input.locale === "ar" ? "الطلب" : "request");

  return createWorkflowMessage({
    context: resolved,
    eventType: "quick_request_materials_requested",
    body:
      input.locale === "ar"
        ? `طلب إضافي قبل التأكيد النهائي: أحتاج ${label}.${note ? `\n${note}` : ""}`
        : `Additional request before final confirmation: please send ${label}.${note ? `\n${note}` : ""}`,
    notificationTitle:
      input.locale === "ar" ? "طلب معلومات إضافية" : "Additional information requested",
    notificationBody:
      input.locale === "ar"
        ? `طلب منك الناشر ${label} قبل تأكيد الاختيار في «${title}».`
        : `The publisher requested ${label} before confirming your selection for “${title}”.`,
    metadata: { requestType: input.requestType, note: note || null },
  });
}

export async function confirmQuickSelectionForPublisher(input: {
  userId: string;
  conversationId: number;
  locale: Locale;
}): Promise<WorkflowResult> {
  const resolved = await resolvePublisherWorkflowContext(
    input.userId,
    input.conversationId,
  );
  if (isWorkflowResult(resolved)) return resolved;

  if (await eventExists(resolved, "quick_request_selection_confirmed")) {
    return { ok: true, code: "ALREADY_EXISTS" };
  }

  const title = resolved.opportunityTitle || (input.locale === "ar" ? "الطلب" : "request");
  return createWorkflowMessage({
    context: resolved,
    eventType: "quick_request_selection_confirmed",
    body:
      input.locale === "ar"
        ? "أكدت اختياري لك لهذا الطلب. يرجى تأكيد قبولك للانتقال إلى مرحلة التواصل المباشر."
        : "I have confirmed my selection of you for this request. Please confirm your acceptance to move to direct contact.",
    notificationTitle:
      input.locale === "ar" ? "تم تأكيد اختيارك" : "Your selection was confirmed",
    notificationBody:
      input.locale === "ar"
        ? `أكد الناشر اختياره لك في «${title}». افتح المحادثة لتأكيد قبولك.`
        : `The publisher confirmed your selection for “${title}”. Open the chat to confirm your acceptance.`,
  });
}
