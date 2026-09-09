import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type TalentInvitationResult =
  | { ok: true; eventId: number; alreadyInvited: boolean }
  | { ok: false; code: "FORBIDDEN" | "OPPORTUNITY_NOT_FOUND" | "OPPORTUNITY_NOT_PUBLISHED" | "TALENT_NOT_FOUND" | "EVENT_FAILED" | "NOTIFICATION_FAILED" };

export async function inviteTalentToPublisherOpportunity(input: {
  publisherUserId: string;
  opportunityId: number;
  talentId: number;
  locale: "ar" | "en";
}): Promise<TalentInvitationResult> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("id,account_type,approval_status,status").eq("user_id", input.publisherUserId).maybeSingle();
  if (!profile || profile.account_type !== "publisher" || profile.approval_status !== "approved" || isRestrictedAccountStatus(profile.status)) return { ok: false, code: "FORBIDDEN" };

  const { data: publisher } = await supabase.from("publishers").select("id,status").eq("profile_id", profile.id).maybeSingle();
  if (!publisher || isRestrictedAccountStatus(publisher.status)) return { ok: false, code: "FORBIDDEN" };

  const { data: opportunity } = await supabase.from("opportunities").select("id,title,slug,publisher_id,published,status").eq("id", input.opportunityId).maybeSingle();
  if (!opportunity || Number(opportunity.publisher_id) !== Number(publisher.id)) return { ok: false, code: "OPPORTUNITY_NOT_FOUND" };
  if (opportunity.published !== true && opportunity.status !== "published") return { ok: false, code: "OPPORTUNITY_NOT_PUBLISHED" };

  const { data: talent } = await supabase.from("talents").select("id,published,status").eq("id", input.talentId).maybeSingle();
  if (!talent || talent.published !== true || isRestrictedAccountStatus(talent.status)) return { ok: false, code: "TALENT_NOT_FOUND" };

  const { data: existing } = await supabase.from("events").select("id").eq("event_type", "talent_invited_to_opportunity").eq("target_type", "opportunity").eq("target_id", String(opportunity.id)).contains("metadata", { talent_id: Number(talent.id), publisher_id: Number(publisher.id) }).order("id", { ascending: false }).limit(1).maybeSingle();
  if (existing?.id) return { ok: true, eventId: Number(existing.id), alreadyInvited: true };

  const { data: event, error: eventError } = await supabase.from("events").insert({
    event_type: "talent_invited_to_opportunity",
    target_type: "opportunity",
    target_id: String(opportunity.id),
    actor_id: input.publisherUserId,
    metadata: {
      talent_id: Number(talent.id),
      publisher_id: Number(publisher.id),
      opportunity_id: Number(opportunity.id),
      opportunity_slug: opportunity.slug ? String(opportunity.slug) : null,
    },
  }).select("id").single();
  if (eventError || !event) { console.error("[talent invitation event]", eventError); return { ok: false, code: "EVENT_FAILED" }; }

  const title = input.locale === "ar" ? "دعوة إلى فرصة" : "Opportunity invitation";
  const body = input.locale === "ar" ? `تمت دعوتك للاطلاع على فرصة: ${opportunity.title}` : `You were invited to view the opportunity: ${opportunity.title}`;
  const { error: notificationError } = await supabase.from("notifications").insert({ event_id: event.id, recipient_type: "talent", recipient_id: String(talent.id), title, body, is_read: false });
  if (notificationError) { console.error("[talent invitation notification]", notificationError); return { ok: false, code: "NOTIFICATION_FAILED" }; }
  return { ok: true, eventId: Number(event.id), alreadyInvited: false };
}
