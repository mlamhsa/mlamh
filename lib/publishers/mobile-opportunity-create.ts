import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createSlug } from "@/lib/services/localization";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set(["actor", "model"]);
const ALLOWED_COMPENSATION = new Set(["fixed", "negotiable", "unpaid"]);
const ALLOWED_GENDERS = new Set(["male", "female", "any"]);
const ALLOWED_DURATIONS = new Set(["1_hour", "2_hours", "4_hours", "full_day"]);

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function nullableInt(value: unknown, min: number, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return undefined;
  return parsed;
}
function cleanDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const text = cleanText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}
function cleanStringArray(value: unknown, maxItems = 8, maxLength = 40) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxItems) return undefined;
  const items = [...new Set(value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean))];
  if (items.some((item) => item.length > maxLength)) return undefined;
  return items;
}

export async function createMobilePublisherOpportunityDraft(userId: string, input: Record<string, unknown>) {
  const title = cleanText(input.title, 140);
  const description = cleanText(input.description, 5000);
  const opportunityType = cleanText(input.opportunityType, 32);
  const city = cleanText(input.city, 120);
  const compensationType = cleanText(input.compensationType, 32) || "fixed";
  const budget = cleanText(input.budget, 120);
  const requiredGender = cleanText(input.requiredGender, 16) || "any";
  const minAge = nullableInt(input.minAge, 0, 120);
  const maxAge = nullableInt(input.maxAge, 0, 120);
  const requiredCount = nullableInt(input.requiredCount, 1, 10000);
  const workDate = cleanDate(input.workDate);
  const applicationStartDate = cleanDate(input.applicationStartDate);
  const applicationDeadline = cleanDate(input.applicationDeadline);
  const workDuration = input.workDuration == null || input.workDuration === "" ? null : cleanText(input.workDuration, 32);

  if (title.length < 4) return { ok: false as const, code: "INVALID_TITLE" as const };
  if (description.length < 20) return { ok: false as const, code: "INVALID_DESCRIPTION" as const };
  if (!ALLOWED_TYPES.has(opportunityType)) return { ok: false as const, code: "INVALID_OPPORTUNITY_TYPE" as const };
  if (!ALLOWED_COMPENSATION.has(compensationType)) return { ok: false as const, code: "INVALID_COMPENSATION" as const };
  if (!ALLOWED_GENDERS.has(requiredGender)) return { ok: false as const, code: "INVALID_GENDER" as const };
  if (minAge === undefined || maxAge === undefined || requiredCount === undefined) return { ok: false as const, code: "INVALID_NUMERIC_FIELD" as const };
  if (minAge !== null && maxAge !== null && minAge > maxAge) return { ok: false as const, code: "INVALID_AGE_RANGE" as const };
  if (workDate === undefined || applicationStartDate === undefined || applicationDeadline === undefined) return { ok: false as const, code: "INVALID_DATE" as const };
  if (workDuration && !ALLOWED_DURATIONS.has(workDuration)) return { ok: false as const, code: "INVALID_WORK_DURATION" as const };
  if (applicationStartDate && applicationDeadline && applicationStartDate > applicationDeadline) return { ok: false as const, code: "INVALID_APPLICATION_WINDOW" as const };

  const roleInput = input.roleRequirements && typeof input.roleRequirements === "object" && !Array.isArray(input.roleRequirements)
    ? input.roleRequirements as Record<string, unknown>
    : {};
  const languages = cleanStringArray(roleInput.languages);
  const dialects = cleanStringArray(roleInput.dialects);
  const modelingTypes = cleanStringArray(roleInput.modelingTypes);
  const minHeightCm = nullableInt(roleInput.minHeightCm, 50, 250);
  const hairColor = roleInput.hairColor == null ? null : cleanText(roleInput.hairColor, 40);
  if (languages === undefined || dialects === undefined || modelingTypes === undefined || minHeightCm === undefined) return { ok: false as const, code: "INVALID_ROLE_REQUIREMENTS" as const };
  const roleRequirements = opportunityType === "actor"
    ? { languages, dialects }
    : { modeling_types: modelingTypes, min_height_cm: minHeightCm, hair_color: hairColor || null };

  const requestedCountryCode = cleanText(input.countryCode, 2).toUpperCase();
  const requestedCurrency = cleanText(input.currency, 3).toUpperCase();
  if (requestedCountryCode && !/^[A-Z]{2}$/.test(requestedCountryCode)) return { ok: false as const, code: "INVALID_COUNTRY" as const };
  if (requestedCurrency && !/^[A-Z]{3}$/.test(requestedCurrency)) return { ok: false as const, code: "INVALID_CURRENCY" as const };

  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,account_type,approval_status,status").eq("user_id", userId).maybeSingle();
  if (profileError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!profile || profile.account_type !== "publisher") return { ok: false as const, code: "NOT_PUBLISHER" as const };
  if (profile.approval_status !== "approved") return { ok: false as const, code: "PUBLISHER_NOT_APPROVED" as const };
  if (isRestrictedAccountStatus(profile.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };

  const { data: publisher, error: publisherError } = await supabase.from("publishers").select("id,company_name,contact_name,country_code,status,publisher_type,verified,verification_status").eq("profile_id", profile.id).maybeSingle();
  if (publisherError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!publisher) return { ok: false as const, code: "PUBLISHER_NOT_FOUND" as const };
  if (isRestrictedAccountStatus(publisher.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };
  const organizationRequiresVerification = publisher.publisher_type !== "individual";
  if (organizationRequiresVerification && !(publisher.verified === true && publisher.verification_status === "verified")) {
    return { ok: false as const, code: "PUBLISHER_NOT_VERIFIED" as const };
  }

  const companyName = publisher.company_name || publisher.contact_name || "MLAMH Publisher";
  const countryCode = requestedCountryCode || publisher.country_code || null;
  const currency = requestedCurrency || null;

  const { data: opportunity, error: insertError } = await supabase.from("opportunities").insert({
    title,
    description,
    slug: createSlug(title),
    opportunity_type: opportunityType,
    city_ar: city || null,
    city_en: city || null,
    company_name: companyName,
    publisher_id: publisher.id,
    status: "draft",
    published: false,
    posting_mode: "project",
    compensation_type: compensationType,
    budget: compensationType === "unpaid" ? null : budget || null,
    application_days: 30,
    country_code: countryCode,
    currency,
    managed_by_mlamh: false,
    required_gender: requiredGender,
    min_age: minAge,
    max_age: maxAge,
    required_count: requiredCount,
    work_date: workDate,
    work_duration: workDuration,
    application_start_date: applicationStartDate,
    application_deadline: applicationDeadline,
    role_requirements: roleRequirements,
  }).select("id,title,status,published,country_code,created_at").single();

  if (insertError || !opportunity) return { ok: false as const, code: "CREATE_FAILED" as const };
  return { ok: true as const, item: { id: Number(opportunity.id), title: opportunity.title, status: opportunity.status, published: Boolean(opportunity.published), countryCode: opportunity.country_code ?? null, createdAt: opportunity.created_at ?? null } };
}
