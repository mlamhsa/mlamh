import { canTransitionApplicationStatus, isApplicationStatus, normalizeApplicationStatus, shouldCreateConversation } from "@/lib/applications/status-rules";
import { createApplicationStatusNotification } from "@/lib/notifications/application-status-notification";
import { createAdminClient } from "@/lib/supabase/admin";
import { signTalentMediaReference } from "@/lib/talents/talent-media-signing";

export type PublisherApplicant = {
  applicationId: number;
  talentId: number;
  name: string;
  imageUrl: string | null;
  category: string | null;
  city: string | null;
  status: string;
  createdAt: string | null;
  conversationId: number | null;
};

export type PublisherOpportunityDetail = {
  opportunity: {
    id: number;
    title: string;
    description: string;
    opportunityType: string;
    city: string | null;
    countryCode: string | null;
    currency: string | null;
    budget: string | null;
    compensationType: string | null;
    status: string | null;
    published: boolean;
    createdAt: string | null;
  };
  applicants: PublisherApplicant[];
};

async function publisherContext(userId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,account_type,approval_status,status").eq("user_id", userId).maybeSingle();
  if (!profile || profile.account_type !== "publisher" || profile.approval_status !== "approved" || ["suspended", "blocked", "inactive"].includes(String(profile.status ?? "").toLowerCase())) return null;
  const { data: publisher } = await admin.from("publishers").select("id,company_name").eq("profile_id", profile.id).maybeSingle();
  if (!publisher) return null;
  return { admin, publisher };
}

export async function getPublisherOpportunityDetail(userId: string, opportunityId: number, locale: "ar" | "en"): Promise<PublisherOpportunityDetail | null> {
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) return null;
  const context = await publisherContext(userId);
  if (!context) return null;
  const { admin, publisher } = context;
  const { data: opportunity } = await admin.from("opportunities").select("id,title,title_en,description,description_en,opportunity_type,city_ar,city_en,country_code,currency,budget,compensation_type,status,published,created_at").eq("id", opportunityId).eq("publisher_id", publisher.id).maybeSingle();
  if (!opportunity) return null;

  const { data: applications, error } = await admin.from("opportunity_applications").select("id,talent_id,status,created_at").eq("opportunity_id", opportunityId).order("created_at", { ascending: false });
  if (error) throw new Error(`[getPublisherOpportunityDetail] ${error.message}`);
  const talentIds = [...new Set((applications ?? []).map((item) => item.talent_id))];
  const [talentsResult, conversationsResult] = await Promise.all([
    talentIds.length ? admin.from("talents").select("id,display_name_ar,display_name_en,name_ar,name_en,image_url,category_ar,category_en,city_ar,city_en").in("id", talentIds) : Promise.resolve({ data: [], error: null }),
    admin.from("conversations").select("id,application_id").eq("opportunity_id", opportunityId),
  ]);
  if (talentsResult.error) throw new Error(`[getPublisherOpportunityDetail] ${talentsResult.error.message}`);
  const talentMap = new Map((talentsResult.data ?? []).map((talent) => [talent.id, talent]));
  const conversationMap = new Map((conversationsResult.data ?? []).map((conversation) => [Number(conversation.application_id), Number(conversation.id)]));
  const localized = (ar: string | null | undefined, en: string | null | undefined, fallback = "") => locale === "ar" ? (ar || en || fallback) : (en || ar || fallback);

  const applicants = await Promise.all((applications ?? []).map(async (application) => {
    const talent = talentMap.get(application.talent_id);
    return {
      applicationId: application.id,
      talentId: application.talent_id,
      name: talent ? localized(talent.display_name_ar || talent.name_ar, talent.display_name_en || talent.name_en, locale === "ar" ? "موهبة" : "Talent") : (locale === "ar" ? "موهبة" : "Talent"),
      imageUrl: talent ? await signTalentMediaReference(talent.image_url, admin) : null,
      category: talent ? localized(talent.category_ar, talent.category_en) || null : null,
      city: talent ? localized(talent.city_ar, talent.city_en) || null : null,
      status: normalizeApplicationStatus(application.status),
      createdAt: application.created_at ?? null,
      conversationId: conversationMap.get(Number(application.id)) ?? null,
    };
  }));

  return {
    opportunity: {
      id: opportunity.id,
      title: localized(opportunity.title, opportunity.title_en),
      description: localized(opportunity.description, opportunity.description_en),
      opportunityType: opportunity.opportunity_type,
      city: localized(opportunity.city_ar, opportunity.city_en) || null,
      countryCode: opportunity.country_code ?? null,
      currency: opportunity.currency ?? null,
      budget: opportunity.budget ?? null,
      compensationType: opportunity.compensation_type ?? null,
      status: opportunity.status ?? null,
      published: Boolean(opportunity.published),
      createdAt: opportunity.created_at ?? null,
    },
    applicants,
  };
}

export async function updatePublisherApplicationStatus(userId: string, opportunityId: number, applicationId: number, rawStatus: unknown) {
  const status = typeof rawStatus === "string" ? rawStatus : "";
  if (!isApplicationStatus(status)) return { ok: false as const, code: "INVALID_STATUS" };
  const context = await publisherContext(userId);
  if (!context) return { ok: false as const, code: "FORBIDDEN" };
  const { admin, publisher } = context;
  const { data: opportunity } = await admin.from("opportunities").select("id,title,publisher_id").eq("id", opportunityId).eq("publisher_id", publisher.id).maybeSingle();
  if (!opportunity) return { ok: false as const, code: "NOT_FOUND" };
  const { data: application } = await admin.from("opportunity_applications").select("id,opportunity_id,talent_id,status").eq("id", applicationId).eq("opportunity_id", opportunityId).maybeSingle();
  if (!application) return { ok: false as const, code: "APPLICATION_NOT_FOUND" };
  const currentStatus = normalizeApplicationStatus(application.status);
  if (currentStatus !== status && !canTransitionApplicationStatus(currentStatus, status)) return { ok: false as const, code: "INVALID_TRANSITION" };

  if (currentStatus !== status) {
    const now = new Date().toISOString();
    const { data: updated, error } = await admin.from("opportunity_applications").update({ status, updated_at: now }).eq("id", application.id).eq("status", application.status).select("id").maybeSingle();
    if (error) return { ok: false as const, code: "UPDATE_FAILED" };
    if (!updated) return { ok: false as const, code: "STALE_APPLICATION" };
    await admin.from("application_status_logs").insert({ application_id: application.id, old_status: currentStatus, new_status: status, changed_by: userId, created_at: now });
    await admin.from("talent_engagement_score").upsert({ talent_id: application.talent_id, last_status: status, updated_at: now });
    if (status === "accepted" || status === "rejected") {
      await createApplicationStatusNotification({ status, talentId: application.talent_id, applicationId: application.id, opportunityId, opportunityTitle: opportunity.title, actorUserId: userId });
    }
  }

  let conversationId: number | null = null;
  if (shouldCreateConversation(status)) {
    const { data: existing } = await admin.from("conversations").select("id").eq("application_id", application.id).maybeSingle();
    if (existing) conversationId = Number(existing.id);
    else {
      const now = new Date().toISOString();
      const { data: created, error } = await admin.from("conversations").insert({ application_id: application.id, opportunity_id: opportunityId, publisher_id: publisher.id, talent_id: application.talent_id, status: "active", created_at: now, updated_at: now }).select("id").single();
      if (error || !created) return { ok: false as const, code: "CONVERSATION_FAILED" };
      conversationId = Number(created.id);
    }
  }

  return { ok: true as const, status, conversationId };
}
