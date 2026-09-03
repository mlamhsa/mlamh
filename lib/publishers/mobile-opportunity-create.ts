import { createAdminClient } from "@/lib/supabase/admin";
import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";

const ALLOWED_TYPES = new Set(["actor", "model"]);
const ALLOWED_COMPENSATION = new Set(["fixed", "negotiable", "unpaid"]);

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function createMobilePublisherOpportunityDraft(userId: string, input: Record<string, unknown>) {
  const title = cleanText(input.title, 140);
  const description = cleanText(input.description, 5000);
  const opportunityType = cleanText(input.opportunityType, 32);
  const city = cleanText(input.city, 120);
  const compensationType = cleanText(input.compensationType, 32) || "fixed";
  const budget = cleanText(input.budget, 120);

  if (title.length < 4) return { ok: false as const, code: "INVALID_TITLE" as const };
  if (description.length < 20) return { ok: false as const, code: "INVALID_DESCRIPTION" as const };
  if (!ALLOWED_TYPES.has(opportunityType)) return { ok: false as const, code: "INVALID_OPPORTUNITY_TYPE" as const };
  if (!ALLOWED_COMPENSATION.has(compensationType)) return { ok: false as const, code: "INVALID_COMPENSATION" as const };

  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,account_type,approval_status,status").eq("user_id", userId).maybeSingle();
  if (profileError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!profile || profile.account_type !== "publisher") return { ok: false as const, code: "NOT_PUBLISHER" as const };
  if (profile.approval_status !== "approved") return { ok: false as const, code: "PUBLISHER_NOT_APPROVED" as const };
  if (isRestrictedAccountStatus(profile.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };

  const { data: publisher, error: publisherError } = await supabase.from("publishers").select("id,company_name,contact_name,country_code,status").eq("profile_id", profile.id).maybeSingle();
  if (publisherError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!publisher) return { ok: false as const, code: "PUBLISHER_NOT_FOUND" as const };
  if (isRestrictedAccountStatus(publisher.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };

  const companyName = publisher.company_name || publisher.contact_name || "MLAMH Publisher";
  const requestedCountryCode = cleanText(input.countryCode, 2).toUpperCase();
  const requestedCurrency = cleanText(input.currency, 3).toUpperCase();
  const countryCode = requestedCountryCode || publisher.country_code || null;
  const currency = requestedCurrency || null;

  const { data: opportunity, error: insertError } = await supabase.from("opportunities").insert({
    title,
    description,
    opportunity_type: opportunityType,
    city_ar: city || null,
    city_en: city || null,
    company_name: companyName,
    publisher_id: publisher.id,
    status: "open",
    published: false,
    posting_mode: "project",
    compensation_type: compensationType,
    budget: budget || null,
    country_code: countryCode,
    currency,
    managed_by_mlamh: false,
  }).select("id,title,status,published,country_code,created_at").single();

  if (insertError || !opportunity) return { ok: false as const, code: "CREATE_FAILED" as const };
  return { ok: true as const, item: { id: Number(opportunity.id), title: opportunity.title, status: opportunity.status, published: Boolean(opportunity.published), countryCode: opportunity.country_code ?? null, createdAt: opportunity.created_at ?? null } };
}
