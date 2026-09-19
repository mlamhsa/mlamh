import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type ShareQuickContactResult =
  | { ok: true; code: "SHARED" | "ALREADY_SHARED" }
  | {
      ok: false;
      code:
        | "INVALID_CONVERSATION"
        | "NOT_FOUND"
        | "CONVERSATION_NOT_ACTIVE"
        | "NOT_QUICK"
        | "PRELIMINARY_SELECTION_REQUIRED"
        | "MUTUAL_CONFIRMATION_REQUIRED"
        | "PHONE_MISSING"
        | "LOOKUP_FAILED"
        | "INSERT_FAILED";
    };

function phoneValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function shareQuickContact(input: {
  userId: string;
  conversationId: number;
  locale: "ar" | "en";
}): Promise<ShareQuickContactResult> {
  if (!Number.isInteger(input.conversationId) || input.conversationId <= 0) {
    return { ok: false, code: "INVALID_CONVERSATION" };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,account_type,approval_status,status,phone")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (profileError) return { ok: false, code: "LOOKUP_FAILED" };
  if (
    !profile ||
    profile.approval_status !== "approved" ||
    isRestrictedAccountStatus(profile.status) ||
    (profile.account_type !== "talent" && profile.account_type !== "publisher")
  ) {
    return { ok: false, code: "NOT_FOUND" };
  }

  let role: "talent" | "publisher";
  let entityId: number;
  let phone = phoneValue(profile.phone);

  if (profile.account_type === "talent") {
    const { data: talent, error } = await admin
      .from("talents")
      .select("id,status")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (error) return { ok: false, code: "LOOKUP_FAILED" };
    if (!talent || isRestrictedAccountStatus(talent.status)) {
      return { ok: false, code: "NOT_FOUND" };
    }
    role = "talent";
    entityId = Number(talent.id);
  } else {
    const { data: publisher, error } = await admin
      .from("publishers")
      .select("id,status,phone")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (error) return { ok: false, code: "LOOKUP_FAILED" };
    if (!publisher || isRestrictedAccountStatus(publisher.status)) {
      return { ok: false, code: "NOT_FOUND" };
    }
    role = "publisher";
    entityId = Number(publisher.id);
    if (!phone) phone = phoneValue(publisher.phone);
  }

  let conversationQuery = admin
    .from("conversations")
    .select("id,application_id,opportunity_id,publisher_id,talent_id,conversation_type,status")
    .eq("id", input.conversationId);
  conversationQuery = role === "talent"
    ? conversationQuery.eq("talent_id", entityId)
    : conversationQuery.eq("publisher_id", entityId).eq("conversation_type", "publisher_talent");

  const { data: conversation, error: conversationError } = await conversationQuery.maybeSingle();
  if (conversationError) return { ok: false, code: "LOOKUP_FAILED" };
  if (!conversation) return { ok: false, code: "NOT_FOUND" };
  if ((conversation.status ?? "active") !== "active") {
    return { ok: false, code: "CONVERSATION_NOT_ACTIVE" };
  }

  const { data: opportunity, error: opportunityError } = await admin
    .from("opportunities")
    .select("id,title,posting_mode")
    .eq("id", conversation.opportunity_id)
    .maybeSingle();
  if (opportunityError) return { ok: false, code: "LOOKUP_FAILED" };
  if (!opportunity || opportunity.posting_mode !== "quick") {
    return { ok: false, code: "NOT_QUICK" };
  }

  if (!conversation.application_id) {
    return { ok: false, code: "PRELIMINARY_SELECTION_REQUIRED" };
  }

  const { data: application, error: applicationError } = await admin
    .from("opportunity_applications")
    .select("id,status")
    .eq("id", conversation.application_id)
    .eq("opportunity_id", conversation.opportunity_id)
    .eq("talent_id", conversation.talent_id)
    .maybeSingle();
  if (applicationError) return { ok: false, code: "LOOKUP_FAILED" };
  if (!application || application.status !== "accepted") {
    return { ok: false, code: "PRELIMINARY_SELECTION_REQUIRED" };
  }

  const { data: confirmationEvents, error: confirmationError } = await admin
    .from("events")
    .select("id,event_type")
    .eq("target_type", "conversation")
    .eq("target_id", String(conversation.id))
    .in("event_type", ["quick_request_talent_confirmed", "quick_request_talent_declined"]);
  if (confirmationError) return { ok: false, code: "LOOKUP_FAILED" };
  const eventTypes = new Set((confirmationEvents ?? []).map((event) => event.event_type));
  if (!eventTypes.has("quick_request_talent_confirmed") || eventTypes.has("quick_request_talent_declined")) {
    return { ok: false, code: "MUTUAL_CONFIRMATION_REQUIRED" };
  }

  if (!phone) return { ok: false, code: "PHONE_MISSING" };

  const { data: existing, error: existingError } = await admin
    .from("events")
    .select("id")
    .eq("event_type", "quick_request_contact_shared")
    .eq("target_type", "conversation")
    .eq("target_id", String(conversation.id))
    .contains("metadata", { sharedBy: role })
    .limit(1);
  if (existingError) return { ok: false, code: "LOOKUP_FAILED" };
  if ((existing ?? []).length > 0) return { ok: true, code: "ALREADY_SHARED" };

  const sharerLabel = role === "publisher"
    ? input.locale === "ar" ? "الناشر" : "publisher"
    : input.locale === "ar" ? "الموهبة" : "talent";
  const now = new Date().toISOString();
  const body = input.locale === "ar"
    ? `📱 شارك ${sharerLabel} رقم التواصل: ${phone}`
    : `📱 The ${sharerLabel} shared a contact number: ${phone}`;

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      sender_user_id: input.userId,
      body,
      read_at: null,
      created_at: now,
    })
    .select("id")
    .single();
  if (messageError || !message) return { ok: false, code: "INSERT_FAILED" };

  const { data: event, error: eventError } = await admin
    .from("events")
    .insert({
      event_type: "quick_request_contact_shared",
      target_type: "conversation",
      target_id: String(conversation.id),
      actor_id: input.userId,
      metadata: {
        conversationId: conversation.id,
        applicationId: application.id,
        opportunityId: opportunity.id,
        messageId: message.id,
        sharedBy: role,
      },
    })
    .select("id")
    .single();

  if (eventError || !event) {
    await admin.from("messages").delete().eq("id", message.id).eq("conversation_id", conversation.id);
    return { ok: false, code: "INSERT_FAILED" };
  }

  const recipientType = role === "publisher" ? "talent" : "publisher";
  const recipientId = role === "publisher" ? conversation.talent_id : conversation.publisher_id;
  const { error: notificationError } = await admin.from("notifications").insert({
    event_id: event.id,
    recipient_type: recipientType,
    recipient_id: String(recipientId),
    title: input.locale === "ar" ? "تمت مشاركة بيانات التواصل" : "Contact details shared",
    body: input.locale === "ar"
      ? `شارك ${sharerLabel} رقم التواصل داخل المحادثة بعد تأكيد التعاون.`
      : `The ${sharerLabel} shared a contact number in the chat after mutual confirmation.`,
    is_read: false,
    created_at: now,
  });
  if (notificationError) console.error("[shareQuickContact notification]", notificationError);

  const { error: updateError } = await admin
    .from("conversations")
    .update({ updated_at: now })
    .eq("id", conversation.id);
  if (updateError) console.error("[shareQuickContact conversation]", updateError);

  return { ok: true, code: "SHARED" };
}
