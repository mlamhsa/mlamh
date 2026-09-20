import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type QuickTalentDecisionResult =
  | { ok: true; decision: "accept" | "decline" }
  | {
      ok: false;
      code:
        | "INVALID_CONVERSATION"
        | "INVALID_DECISION"
        | "NOT_TALENT"
        | "ACCOUNT_RESTRICTED"
        | "CONVERSATION_NOT_FOUND"
        | "CONVERSATION_NOT_ACTIVE"
        | "NOT_QUICK_REQUEST"
        | "PRELIMINARY_SELECTION_REQUIRED"
        | "PUBLISHER_CONFIRMATION_REQUIRED"
        | "ALREADY_DECIDED"
        | "WRITE_FAILED";
    };

async function hasEvent(
  admin: ReturnType<typeof createAdminClient>,
  conversationId: number,
  eventType: string,
) {
  const { data, error } = await admin
    .from("events")
    .select("id")
    .eq("event_type", eventType)
    .eq("target_type", "conversation")
    .eq("target_id", String(conversationId))
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function respondToQuickRequestAsTalent(input: {
  userId: string;
  conversationId: number;
  decision: "accept" | "decline";
  locale: "ar" | "en";
}): Promise<QuickTalentDecisionResult> {
  if (!Number.isInteger(input.conversationId) || input.conversationId <= 0) {
    return { ok: false, code: "INVALID_CONVERSATION" };
  }
  if (input.decision !== "accept" && input.decision !== "decline") {
    return { ok: false, code: "INVALID_DECISION" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type,approval_status,status")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!profile || profile.account_type !== "talent") return { ok: false, code: "NOT_TALENT" };
  if (profile.approval_status !== "approved" || isRestrictedAccountStatus(profile.status)) {
    return { ok: false, code: "ACCOUNT_RESTRICTED" };
  }

  const { data: talent } = await admin
    .from("talents")
    .select("id,status")
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!talent || isRestrictedAccountStatus(talent.status)) return { ok: false, code: "ACCOUNT_RESTRICTED" };

  const { data: conversation } = await admin
    .from("conversations")
    .select("id,application_id,opportunity_id,publisher_id,talent_id,status")
    .eq("id", input.conversationId)
    .eq("talent_id", talent.id)
    .maybeSingle();
  if (!conversation) return { ok: false, code: "CONVERSATION_NOT_FOUND" };
  if ((conversation.status ?? "active") !== "active") return { ok: false, code: "CONVERSATION_NOT_ACTIVE" };

  const { data: opportunity } = await admin
    .from("opportunities")
    .select("id,title,posting_mode")
    .eq("id", conversation.opportunity_id)
    .maybeSingle();
  if (!opportunity || opportunity.posting_mode !== "quick") return { ok: false, code: "NOT_QUICK_REQUEST" };
  if (!conversation.application_id) return { ok: false, code: "PRELIMINARY_SELECTION_REQUIRED" };

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

  try {
    if (!(await hasEvent(admin, input.conversationId, "quick_request_selection_confirmed"))) {
      return { ok: false, code: "PUBLISHER_CONFIRMATION_REQUIRED" };
    }
    if (
      (await hasEvent(admin, input.conversationId, "quick_request_talent_confirmed")) ||
      (await hasEvent(admin, input.conversationId, "quick_request_talent_declined"))
    ) {
      return { ok: false, code: "ALREADY_DECIDED" };
    }
  } catch (error) {
    console.error("[quick-talent-decision:event-check]", error);
    return { ok: false, code: "WRITE_FAILED" };
  }

  const accepted = input.decision === "accept";
  const now = new Date().toISOString();
  const body = accepted
    ? input.locale === "ar"
      ? "أكدت قبولي لهذا الطلب."
      : "I confirmed my acceptance of this request."
    : input.locale === "ar"
      ? "أعتذر، لن أتمكن من متابعة هذا الطلب."
      : "I’m sorry, I won’t be able to continue with this request.";

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_user_id: input.userId,
      body,
      read_at: null,
      created_at: now,
    })
    .select("id")
    .single();
  if (messageError || !message) return { ok: false, code: "WRITE_FAILED" };

  const eventType = accepted ? "quick_request_talent_confirmed" : "quick_request_talent_declined";
  const { data: event, error: eventError } = await admin
    .from("events")
    .insert({
      event_type: eventType,
      target_type: "conversation",
      target_id: String(input.conversationId),
      actor_id: input.userId,
      metadata: {
        conversationId: input.conversationId,
        applicationId: application.id,
        opportunityId: opportunity.id,
        messageId: message.id,
      },
    })
    .select("id")
    .single();

  if (eventError || !event) {
    await admin.from("messages").delete().eq("id", message.id).eq("conversation_id", input.conversationId);
    return { ok: false, code: "WRITE_FAILED" };
  }

  const title = opportunity.title || (input.locale === "ar" ? "الطلب" : "request");
  const { error: notificationError } = await admin.from("notifications").insert({
    event_id: event.id,
    recipient_type: "publisher",
    recipient_id: String(conversation.publisher_id),
    title: accepted
      ? (input.locale === "ar" ? "الموهبة أكدت الطلب" : "Talent confirmed the request")
      : (input.locale === "ar" ? "الموهبة اعتذرت عن الطلب" : "Talent declined the request"),
    body: accepted
      ? (input.locale === "ar" ? `أكدت الموهبة قبولها في «${title}».` : `The talent confirmed “${title}”.`)
      : (input.locale === "ar" ? `اعتذرت الموهبة عن «${title}».` : `The talent declined “${title}”.`),
    is_read: false,
    created_at: now,
  });
  if (notificationError) console.error("[quick-talent-decision:notification]", notificationError);

  const { error: conversationError } = await admin
    .from("conversations")
    .update({ updated_at: now })
    .eq("id", input.conversationId);
  if (conversationError) console.error("[quick-talent-decision:conversation]", conversationError);

  return { ok: true, decision: input.decision };
}