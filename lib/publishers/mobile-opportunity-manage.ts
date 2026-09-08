import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createEvent, EVENT_TARGETS, EVENT_TYPES } from "@/lib/events";
import { isCountryCode } from "@/lib/markets/countries";
import { isMarketFeatureEnabled, resolveMarketCurrency } from "@/lib/markets/config";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set(["actor", "model"]);
const ALLOWED_COMPENSATION = new Set(["fixed", "negotiable", "unpaid"]);
const ALLOWED_GENDERS = new Set(["male", "female", "any"]);
const ALLOWED_DURATIONS = new Set(["1_hour", "2_hours", "4_hours", "full_day"]);
const EDITABLE_STATUSES = new Set(["draft", "open", "needs_changes", "closed"]);
const SUBMITTABLE_STATUSES = new Set(["draft", "open", "needs_changes", "closed"]);
export const PUBLISHER_OPPORTUNITY_ACTIONS = ["edit", "publish", "close", "archive"] as const;
export type PublisherOpportunityAction = (typeof PUBLISHER_OPPORTUNITY_ACTIONS)[number];

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

function isAction(value: unknown): value is PublisherOpportunityAction {
  return typeof value === "string" && PUBLISHER_OPPORTUNITY_ACTIONS.includes(value as PublisherOpportunityAction);
}

async function getPublisherContext(userId: string) {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles").select("id,account_type,approval_status,status").eq("user_id", userId).maybeSingle();
  if (profileError || !profile || profile.account_type !== "publisher") return null;
  if (profile.approval_status !== "approved" || isRestrictedAccountStatus(profile.status)) return null;
  const { data: publisher, error: publisherError } = await admin.from("publishers").select("id,country_code,status,publisher_type,verified,verification_status").eq("profile_id", profile.id).maybeSingle();
  if (publisherError || !publisher || isRestrictedAccountStatus(publisher.status)) return null;
  return { admin, publisher };
}

function isVerifiedPublisher(publisher: { publisher_type: string | null; verified: boolean | null; verification_status: string | null }) {
  return publisher.publisher_type === "individual" || (publisher.verified === true && publisher.verification_status === "verified");
}

function resolveEnabledOpportunityMarket(value: unknown) {
  const countryCode = cleanText(value, 2).toUpperCase();
  if (!isCountryCode(countryCode)) return { ok: false as const, code: "INVALID_COUNTRY" as const };
  if (!isMarketFeatureEnabled(countryCode, "opportunityCreation")) return { ok: false as const, code: "MARKET_NOT_ACTIVE" as const };
  return { ok: true as const, countryCode, currency: resolveMarketCurrency(countryCode) };
}

export async function manageMobilePublisherOpportunity(userId: string, opportunityId: number, input: Record<string, unknown>) {
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) return { ok: false as const, code: "INVALID_OPPORTUNITY" as const };
  if (!isAction(input.action)) return { ok: false as const, code: "INVALID_ACTION" as const };

  const context = await getPublisherContext(userId);
  if (!context) return { ok: false as const, code: "FORBIDDEN" as const };
  const { admin, publisher } = context;
  const { data: existing, error: lookupError } = await admin.from("opportunities")
    .select("id,title,description,opportunity_type,city_ar,city_en,country_code,currency,budget,compensation_type,status,published,required_gender,min_age,max_age,required_count,work_date,work_duration,application_start_date,application_deadline,role_requirements")
    .eq("id", opportunityId).eq("publisher_id", publisher.id).maybeSingle();
  if (lookupError) return { ok: false as const, code: "LOOKUP_FAILED" as const };
  if (!existing) return { ok: false as const, code: "NOT_FOUND" as const };

  const now = new Date().toISOString();

  if (input.action === "publish") {
    if (!isVerifiedPublisher(publisher)) return { ok: false as const, code: "PUBLISHER_NOT_VERIFIED" as const };
    if (existing.status === "archived") return { ok: false as const, code: "ARCHIVED" as const };
    if (existing.status === "published" || existing.published) return { ok: false as const, code: "ALREADY_PUBLISHED" as const };
    if (existing.status === "pending_review") return { ok: false as const, code: "ALREADY_PENDING_REVIEW" as const };
    if (existing.status === "rejected") return { ok: false as const, code: "REJECTED" as const };
    if (!SUBMITTABLE_STATUSES.has(String(existing.status ?? "draft"))) return { ok: false as const, code: "INVALID_STATE" as const };
    if (cleanText(existing.title, 140).length < 4 || cleanText(existing.description, 5000).length < 20) return { ok: false as const, code: "INCOMPLETE_OPPORTUNITY" as const };
    if (!ALLOWED_TYPES.has(String(existing.opportunity_type ?? ""))) return { ok: false as const, code: "INVALID_OPPORTUNITY_TYPE" as const };

    const market = resolveEnabledOpportunityMarket(existing.country_code || publisher.country_code || "SA");
    if (!market.ok) return market;
    const existingCurrency = cleanText(existing.currency, 3).toUpperCase();
    const compensationType = cleanText(existing.compensation_type, 32);
    if (compensationType !== "unpaid" && existingCurrency && existingCurrency !== market.currency) return { ok: false as const, code: "INVALID_CURRENCY" as const };
    const currency = compensationType === "unpaid" ? null : market.currency;

    const { data, error } = await admin.from("opportunities").update({ published: false, status: "pending_review", country_code: market.countryCode, currency, updated_at: now }).eq("id", opportunityId).eq("publisher_id", publisher.id).select("id,status,published").single();
    if (error || !data) return { ok: false as const, code: "UPDATE_FAILED" as const };

    try {
      await createEvent({
        type: EVENT_TYPES.opportunity_pending_review,
        target: EVENT_TARGETS.ADMIN,
        targetId: "admin",
        actorId: publisher.id,
        metadata: { opportunityId, publisherId: publisher.id, title: existing.title, countryCode: market.countryCode, source: "mobile" },
      });
    } catch (eventError) {
      console.error("[manageMobilePublisherOpportunity submit event]", eventError);
    }

    return { ok: true as const, item: { id: Number(data.id), status: data.status, published: Boolean(data.published) } };
  }

  if (input.action === "close" || input.action === "archive") {
    const nextStatus = input.action === "close" ? "closed" : "archived";
    const { data, error } = await admin.from("opportunities").update({ published: false, status: nextStatus, updated_at: now }).eq("id", opportunityId).eq("publisher_id", publisher.id).select("id,status,published").single();
    if (error || !data) return { ok: false as const, code: "UPDATE_FAILED" as const };
    return { ok: true as const, item: { id: Number(data.id), status: data.status, published: Boolean(data.published) } };
  }

  if (existing.status === "archived") return { ok: false as const, code: "ARCHIVED" as const };
  if (!EDITABLE_STATUSES.has(String(existing.status ?? "draft"))) return { ok: false as const, code: "EDIT_LOCKED" as const };

  const patch: Record<string, unknown> = { updated_at: now };
  let changed = false;

  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    const title = cleanText(input.title, 140);
    if (title.length < 4) return { ok: false as const, code: "INVALID_TITLE" as const };
    patch.title = title; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "description")) {
    const description = cleanText(input.description, 5000);
    if (description.length < 20) return { ok: false as const, code: "INVALID_DESCRIPTION" as const };
    patch.description = description; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "opportunityType")) {
    const opportunityType = cleanText(input.opportunityType, 32);
    if (!ALLOWED_TYPES.has(opportunityType)) return { ok: false as const, code: "INVALID_OPPORTUNITY_TYPE" as const };
    patch.opportunity_type = opportunityType; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "city")) {
    const city = cleanText(input.city, 120);
    patch.city_ar = city || null; patch.city_en = city || null; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "compensationType")) {
    const compensationType = cleanText(input.compensationType, 32);
    if (!ALLOWED_COMPENSATION.has(compensationType)) return { ok: false as const, code: "INVALID_COMPENSATION" as const };
    patch.compensation_type = compensationType; changed = true;
    if (compensationType === "unpaid") patch.budget = null;
  }
  if (Object.prototype.hasOwnProperty.call(input, "budget")) {
    patch.budget = cleanText(input.budget, 120) || null; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "countryCode")) {
    const market = resolveEnabledOpportunityMarket(input.countryCode);
    if (!market.ok) return market;
    patch.country_code = market.countryCode; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "requiredGender")) {
    const gender = cleanText(input.requiredGender, 16);
    if (!ALLOWED_GENDERS.has(gender)) return { ok: false as const, code: "INVALID_GENDER" as const };
    patch.required_gender = gender; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "minAge")) {
    const value = nullableInt(input.minAge, 0, 120); if (value === undefined) return { ok: false as const, code: "INVALID_AGE_RANGE" as const }; patch.min_age = value; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "maxAge")) {
    const value = nullableInt(input.maxAge, 0, 120); if (value === undefined) return { ok: false as const, code: "INVALID_AGE_RANGE" as const }; patch.max_age = value; changed = true;
  }
  const effectiveMinAge = Object.prototype.hasOwnProperty.call(patch, "min_age") ? patch.min_age as number | null : existing.min_age;
  const effectiveMaxAge = Object.prototype.hasOwnProperty.call(patch, "max_age") ? patch.max_age as number | null : existing.max_age;
  if (effectiveMinAge !== null && effectiveMinAge !== undefined && effectiveMaxAge !== null && effectiveMaxAge !== undefined && effectiveMinAge > effectiveMaxAge) return { ok: false as const, code: "INVALID_AGE_RANGE" as const };
  if (Object.prototype.hasOwnProperty.call(input, "requiredCount")) {
    const value = nullableInt(input.requiredCount, 1, 10000); if (value === undefined) return { ok: false as const, code: "INVALID_NUMERIC_FIELD" as const }; patch.required_count = value; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "workDate")) {
    const value = cleanDate(input.workDate); if (value === undefined) return { ok: false as const, code: "INVALID_DATE" as const }; patch.work_date = value; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "workDuration")) {
    const value = input.workDuration == null || input.workDuration === "" ? null : cleanText(input.workDuration, 32); if (value && !ALLOWED_DURATIONS.has(value)) return { ok: false as const, code: "INVALID_WORK_DURATION" as const }; patch.work_duration = value; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "applicationStartDate")) {
    const value = cleanDate(input.applicationStartDate); if (value === undefined) return { ok: false as const, code: "INVALID_DATE" as const }; patch.application_start_date = value; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "applicationDeadline")) {
    const value = cleanDate(input.applicationDeadline); if (value === undefined) return { ok: false as const, code: "INVALID_DATE" as const }; patch.application_deadline = value; changed = true;
  }
  const effectiveStart = Object.prototype.hasOwnProperty.call(patch, "application_start_date") ? patch.application_start_date as string | null : existing.application_start_date;
  const effectiveDeadline = Object.prototype.hasOwnProperty.call(patch, "application_deadline") ? patch.application_deadline as string | null : existing.application_deadline;
  if (effectiveStart && effectiveDeadline && effectiveStart > effectiveDeadline) return { ok: false as const, code: "INVALID_APPLICATION_WINDOW" as const };
  if (Object.prototype.hasOwnProperty.call(input, "roleRequirements")) {
    if (!input.roleRequirements || typeof input.roleRequirements !== "object" || Array.isArray(input.roleRequirements)) return { ok: false as const, code: "INVALID_ROLE_REQUIREMENTS" as const };
    const roleInput = input.roleRequirements as Record<string, unknown>;
    const languages = cleanStringArray(roleInput.languages);
    const dialects = cleanStringArray(roleInput.dialects);
    const modelingTypes = cleanStringArray(roleInput.modelingTypes);
    const minHeightCm = nullableInt(roleInput.minHeightCm, 50, 250);
    const hairColor = roleInput.hairColor == null ? null : cleanText(roleInput.hairColor, 40);
    if (languages === undefined || dialects === undefined || modelingTypes === undefined || minHeightCm === undefined) return { ok: false as const, code: "INVALID_ROLE_REQUIREMENTS" as const };
    const effectiveType = String(patch.opportunity_type ?? existing.opportunity_type ?? "");
    patch.role_requirements = effectiveType === "actor" ? { languages, dialects } : { modeling_types: modelingTypes, min_height_cm: minHeightCm, hair_color: hairColor || null };
    changed = true;
  }

  const market = resolveEnabledOpportunityMarket(patch.country_code ?? existing.country_code ?? publisher.country_code ?? "SA");
  if (!market.ok) return market;
  const effectiveCompensation = String(patch.compensation_type ?? existing.compensation_type ?? "fixed");
  const requestedCurrency = Object.prototype.hasOwnProperty.call(input, "currency") ? cleanText(input.currency, 3).toUpperCase() : cleanText(existing.currency, 3).toUpperCase();
  if (effectiveCompensation !== "unpaid" && requestedCurrency && requestedCurrency !== market.currency) return { ok: false as const, code: "INVALID_CURRENCY" as const };
  const canonicalCurrency = effectiveCompensation === "unpaid" ? null : market.currency;
  if (patch.country_code !== market.countryCode) patch.country_code = market.countryCode;
  if (existing.currency !== canonicalCurrency || Object.prototype.hasOwnProperty.call(input, "currency") || Object.prototype.hasOwnProperty.call(input, "countryCode") || Object.prototype.hasOwnProperty.call(input, "compensationType")) {
    patch.currency = canonicalCurrency;
    changed = true;
  }

  if (!changed) return { ok: false as const, code: "NO_CHANGES" as const };

  const { data, error } = await admin.from("opportunities").update(patch).eq("id", opportunityId).eq("publisher_id", publisher.id).select("id,status,published").single();
  if (error || !data) return { ok: false as const, code: "UPDATE_FAILED" as const };
  return { ok: true as const, item: { id: Number(data.id), status: data.status, published: Boolean(data.published) } };
}
