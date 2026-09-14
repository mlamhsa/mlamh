"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WorkflowRole = "publisher" | "talent";
type MaterialRequestType =
  | "portfolio"
  | "intro_video"
  | "measurements"
  | "availability";

type WorkflowContext = {
  adminClient: ReturnType<typeof createAdminClient>;
  user: { id: string };
  role: WorkflowRole;
  conversation: {
    id: number;
    application_id: number | null;
    opportunity_id: number;
    publisher_id: number;
    talent_id: number;
    status: string | null;
  };
  opportunity: {
    id: number;
    title: string | null;
    posting_mode: string | null;
  };
  application: {
    id: number;
    status: string | null;
  };
  phone: string | null;
};

const MATERIAL_LABELS: Record<
  MaterialRequestType,
  { ar: string; en: string }
> = {
  portfolio: { ar: "معرض الأعمال", en: "portfolio" },
  intro_video: { ar: "فيديو تعريفي", en: "intro video" },
  measurements: { ar: "المقاسات / التفاصيل", en: "measurements / details" },
  availability: { ar: "التوفر للموعد", en: "availability" },
};

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getLocale(formData: FormData) {
  return String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
}

function conversationPath(
  locale: string,
  role: WorkflowRole,
  conversationId: number,
) {
  return `/${locale}/${role}-dashboard/messages/${conversationId}`;
}

function revalidateWorkflowPaths(
  locale: string,
  conversationId: number,
) {
  revalidatePath(
    conversationPath(locale, "publisher", conversationId),
  );
  revalidatePath(
    conversationPath(locale, "talent", conversationId),
  );
  revalidatePath(`/${locale}/publisher-dashboard/messages`);
  revalidatePath(`/${locale}/talent-dashboard/messages`);
  revalidatePath(`/${locale}/publisher-dashboard/notifications`);
  revalidatePath(`/${locale}/talent-dashboard/notifications`);
  revalidatePath(`/${locale}/publisher-dashboard/applicants`);
  revalidatePath(`/${locale}/talent-dashboard/applications`);
}

async function getWorkflowContext(
  conversationId: number,
): Promise<WorkflowContext> {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized.");

  const { data: conversation, error: conversationError } =
    await adminClient
      .from("conversations")
      .select(
        "id,application_id,opportunity_id,publisher_id,talent_id,status",
      )
      .eq("id", conversationId)
      .maybeSingle();

  if (conversationError || !conversation) {
    throw new Error("Conversation not found.");
  }

  if ((conversation.status ?? "active") !== "active") {
    throw new Error("This conversation is closed.");
  }

  const { data: opportunity, error: opportunityError } =
    await adminClient
      .from("opportunities")
      .select("id,title,posting_mode")
      .eq("id", conversation.opportunity_id)
      .maybeSingle();

  if (opportunityError || !opportunity) {
    throw new Error("Opportunity not found.");
  }

  if (opportunity.posting_mode !== "quick") {
    throw new Error("This workflow is only available for Quick Requests.");
  }

  if (!conversation.application_id) {
    throw new Error("A preliminary selection is required first.");
  }

  const { data: application, error: applicationError } =
    await adminClient
      .from("opportunity_applications")
      .select("id,status")
      .eq("id", conversation.application_id)
      .eq("opportunity_id", conversation.opportunity_id)
      .eq("talent_id", conversation.talent_id)
      .maybeSingle();

  if (applicationError || !application) {
    throw new Error("Application not found.");
  }

  if (application.status !== "accepted") {
    throw new Error("The talent must be selected preliminarily first.");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,account_type,phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error("Profile not found.");

  let role: WorkflowRole;
  let phone = profile.phone ? String(profile.phone).trim() : "";

  if (profile.account_type === "publisher") {
    const { data: publisher, error: publisherError } = await adminClient
      .from("publishers")
      .select("id,phone")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (
      publisherError ||
      !publisher ||
      Number(publisher.id) !== Number(conversation.publisher_id)
    ) {
      throw new Error("Access denied.");
    }

    role = "publisher";
    if (!phone && publisher.phone) phone = String(publisher.phone).trim();
  } else if (profile.account_type === "talent") {
    const { data: talent, error: talentError } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      talentError ||
      !talent ||
      Number(talent.id) !== Number(conversation.talent_id)
    ) {
      throw new Error("Access denied.");
    }

    role = "talent";
  } else {
    throw new Error("Access denied.");
  }

  return {
    adminClient,
    user: { id: user.id },
    role,
    conversation: {
      id: Number(conversation.id),
      application_id: conversation.application_id
        ? Number(conversation.application_id)
        : null,
      opportunity_id: Number(conversation.opportunity_id),
      publisher_id: Number(conversation.publisher_id),
      talent_id: Number(conversation.talent_id),
      status: conversation.status,
    },
    opportunity: {
      id: Number(opportunity.id),
      title: opportunity.title,
      posting_mode: opportunity.posting_mode,
    },
    application: {
      id: Number(application.id),
      status: application.status,
    },
    phone: phone || null,
  };
}

async function eventExists(
  context: WorkflowContext,
  eventType: string,
  metadataContains?: Record<string, unknown>,
) {
  let query = context.adminClient
    .from("events")
    .select("id")
    .eq("event_type", eventType)
    .eq("target_type", "conversation")
    .eq("target_id", String(context.conversation.id))
    .limit(1);

  if (metadataContains) {
    query = query.contains("metadata", metadataContains);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

async function createWorkflowMessage({
  context,
  eventType,
  locale,
  body,
  notificationTitle,
  notificationBody,
  metadata,
}: {
  context: WorkflowContext;
  eventType: string;
  locale: string;
  body: string;
  notificationTitle: string;
  notificationBody: string;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();

  const { data: message, error: messageError } = await context.adminClient
    .from("messages")
    .insert({
      conversation_id: context.conversation.id,
      sender_user_id: context.user.id,
      body,
      read_at: null,
      created_at: now,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    throw new Error(messageError?.message ?? "Unable to create message.");
  }

  const { data: event, error: eventError } = await context.adminClient
    .from("events")
    .insert({
      event_type: eventType,
      target_type: "conversation",
      target_id: String(context.conversation.id),
      actor_id: context.user.id,
      metadata: {
        conversationId: context.conversation.id,
        applicationId: context.application.id,
        opportunityId: context.opportunity.id,
        messageId: message.id,
        ...metadata,
      },
    })
    .select("id")
    .single();

  if (eventError || !event) {
    await context.adminClient
      .from("messages")
      .delete()
      .eq("id", message.id)
      .eq("conversation_id", context.conversation.id);
    throw new Error(eventError?.message ?? "Unable to record workflow event.");
  }

  const recipientType = context.role === "publisher" ? "talent" : "publisher";
  const recipientId =
    context.role === "publisher"
      ? context.conversation.talent_id
      : context.conversation.publisher_id;

  const { error: notificationError } = await context.adminClient
    .from("notifications")
    .insert({
      event_id: event.id,
      recipient_type: recipientType,
      recipient_id: String(recipientId),
      title: notificationTitle,
      body: notificationBody,
      is_read: false,
      created_at: now,
    });

  if (notificationError) {
    console.error("Quick Request workflow notification error:", notificationError);
  }

  const { error: conversationUpdateError } = await context.adminClient
    .from("conversations")
    .update({ updated_at: now })
    .eq("id", context.conversation.id);

  if (conversationUpdateError) {
    console.error(
      "Quick Request workflow conversation update error:",
      conversationUpdateError,
    );
  }

  revalidateWorkflowPaths(locale, context.conversation.id);
}

export async function requestQuickRequestMaterialsAction(formData: FormData) {
  const conversationId = positiveInteger(formData.get("conversationId"));
  const locale = getLocale(formData);
  const requestType = String(formData.get("requestType") ?? "") as MaterialRequestType;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!conversationId) throw new Error("Invalid conversation.");
  if (!Object.prototype.hasOwnProperty.call(MATERIAL_LABELS, requestType)) {
    throw new Error("Invalid request type.");
  }

  const context = await getWorkflowContext(conversationId);
  if (context.role !== "publisher") throw new Error("Publisher access required.");

  if (
    await eventExists(context, "quick_request_materials_requested", {
      requestType,
    })
  ) {
    revalidateWorkflowPaths(locale, conversationId);
    return;
  }

  const label = MATERIAL_LABELS[requestType][locale];
  const title = context.opportunity.title || (locale === "ar" ? "الطلب" : "request");
  const body =
    locale === "ar"
      ? `طلب إضافي قبل التأكيد النهائي: أحتاج ${label}.${note ? `\n${note}` : ""}`
      : `Additional request before final confirmation: please send ${label}.${note ? `\n${note}` : ""}`;

  await createWorkflowMessage({
    context,
    eventType: "quick_request_materials_requested",
    locale,
    body,
    notificationTitle:
      locale === "ar" ? "طلب معلومات إضافية" : "Additional information requested",
    notificationBody:
      locale === "ar"
        ? `طلب منك الناشر ${label} قبل تأكيد الاختيار في «${title}».`
        : `The publisher requested ${label} before confirming your selection for “${title}”.`,
    metadata: { requestType, note: note || null },
  });
}

export async function confirmQuickRequestSelectionAction(formData: FormData) {
  const conversationId = positiveInteger(formData.get("conversationId"));
  const locale = getLocale(formData);

  if (!conversationId) throw new Error("Invalid conversation.");

  const context = await getWorkflowContext(conversationId);
  if (context.role !== "publisher") throw new Error("Publisher access required.");

  if (await eventExists(context, "quick_request_selection_confirmed")) {
    revalidateWorkflowPaths(locale, conversationId);
    return;
  }

  const title = context.opportunity.title || (locale === "ar" ? "الطلب" : "request");
  const body =
    locale === "ar"
      ? "أكدت اختياري لك لهذا الطلب. يرجى تأكيد قبولك للانتقال إلى مرحلة التواصل المباشر."
      : "I have confirmed my selection of you for this request. Please confirm your acceptance to move to direct contact.";

  await createWorkflowMessage({
    context,
    eventType: "quick_request_selection_confirmed",
    locale,
    body,
    notificationTitle:
      locale === "ar" ? "تم تأكيد اختيارك" : "Your selection was confirmed",
    notificationBody:
      locale === "ar"
        ? `أكد الناشر اختياره لك في «${title}». افتح المحادثة لتأكيد قبولك.`
        : `The publisher confirmed your selection for “${title}”. Open the chat to confirm your acceptance.`,
  });
}

export async function respondToQuickRequestSelectionAction(formData: FormData) {
  const conversationId = positiveInteger(formData.get("conversationId"));
  const locale = getLocale(formData);
  const decision = String(formData.get("decision") ?? "");

  if (!conversationId) throw new Error("Invalid conversation.");
  if (decision !== "accept" && decision !== "decline") {
    throw new Error("Invalid decision.");
  }

  const context = await getWorkflowContext(conversationId);
  if (context.role !== "talent") throw new Error("Talent access required.");

  if (!(await eventExists(context, "quick_request_selection_confirmed"))) {
    throw new Error("The publisher has not confirmed the selection yet.");
  }

  if (
    (await eventExists(context, "quick_request_talent_confirmed")) ||
    (await eventExists(context, "quick_request_talent_declined"))
  ) {
    revalidateWorkflowPaths(locale, conversationId);
    return;
  }

  const accepted = decision === "accept";
  const title = context.opportunity.title || (locale === "ar" ? "الطلب" : "request");

  await createWorkflowMessage({
    context,
    eventType: accepted
      ? "quick_request_talent_confirmed"
      : "quick_request_talent_declined",
    locale,
    body: accepted
      ? locale === "ar"
        ? "أكدت قبولي لهذا الطلب. يمكننا الآن مشاركة بيانات التواصل أو الاستمرار داخل ملامح."
        : "I confirm my acceptance of this request. We can now share contact details or continue inside MLAMH."
      : locale === "ar"
        ? "أعتذر، لا أستطيع تأكيد هذا الطلب حاليًا."
        : "Sorry, I cannot confirm this request at this time.",
    notificationTitle: accepted
      ? locale === "ar"
        ? "الموهبة أكدت القبول"
        : "Talent confirmed acceptance"
      : locale === "ar"
        ? "الموهبة اعتذرت عن الطلب"
        : "Talent declined the request",
    notificationBody: accepted
      ? locale === "ar"
        ? `أكدت الموهبة قبولها في «${title}». يمكنكما الآن مشاركة بيانات التواصل.`
        : `The talent confirmed acceptance for “${title}”. You can now share contact details.`
      : locale === "ar"
        ? `اعتذرت الموهبة عن الاستمرار في «${title}».`
        : `The talent declined to continue with “${title}”.`,
  });
}

export async function shareQuickRequestContactAction(formData: FormData) {
  const conversationId = positiveInteger(formData.get("conversationId"));
  const locale = getLocale(formData);

  if (!conversationId) throw new Error("Invalid conversation.");

  const context = await getWorkflowContext(conversationId);

  if (!(await eventExists(context, "quick_request_talent_confirmed"))) {
    throw new Error("Both sides must confirm the collaboration first.");
  }

  if (!context.phone) {
    throw new Error("No mobile number is saved on this account.");
  }

  if (
    await eventExists(context, "quick_request_contact_shared", {
      sharedBy: context.role,
    })
  ) {
    revalidateWorkflowPaths(locale, conversationId);
    return;
  }

  const sharerLabel =
    context.role === "publisher"
      ? locale === "ar"
        ? "الناشر"
        : "publisher"
      : locale === "ar"
        ? "الموهبة"
        : "talent";

  await createWorkflowMessage({
    context,
    eventType: "quick_request_contact_shared",
    locale,
    body:
      locale === "ar"
        ? `📱 شارك ${sharerLabel} رقم التواصل: ${context.phone}`
        : `📱 The ${sharerLabel} shared a contact number: ${context.phone}`,
    notificationTitle:
      locale === "ar" ? "تمت مشاركة بيانات التواصل" : "Contact details shared",
    notificationBody:
      locale === "ar"
        ? `شارك ${sharerLabel} رقم التواصل داخل المحادثة بعد تأكيد التعاون.`
        : `The ${sharerLabel} shared a contact number in the chat after mutual confirmation.`,
    metadata: { sharedBy: context.role },
  });
}
