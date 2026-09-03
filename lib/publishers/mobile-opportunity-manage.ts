import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set(["actor", "model"]);
const ALLOWED_COMPENSATION = new Set(["fixed", "negotiable", "unpaid"]);
export const PUBLISHER_OPPORTUNITY_ACTIONS = ["edit", "publish", "close", "archive"] as const;
export type PublisherOpportunityAction = (typeof PUBLISHER_OPPORTUNITY_ACTIONS)[number];

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function isAction(value: unknown): value is PublisherOpportunityAction {
  return typeof value === "string" && PUBLISHER_OPPORTUNITY_ACTIONS.includes(value as PublisherOpportunityAction);
}

async function getPublisherContext(userId: string) {
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles").select("id,account_type,approval_status,status").eq("user_id", userId).maybeSingle();
  if (profileError || !profile || profile.account_type !== "publisher") return null;
  if (profile.approval_status !== "approved" || isRestrictedAccountStatus(profile.status)) return null;
  const { data: publisher, error: publisherError } = await admin.from("publishers").select("id,country_code,status").eq("profile_id", profile.id).maybeSingle();
  if (publisherError || !publisher || isRestrictedAccountStatus(publisher.status)) return null;
  return { admin, publisher };
}

export async function manageMobilePublisherOpportunity(userId: string, opportunityId: number, input: Record<string, unknown>) {
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) return { ok: false as const, code: "INVALID_OPPORTUNITY" as const };
  if (!isAction(input.action)) return { ok: false as const, code: "INVALID_ACTION" as const };

  const context = await getPublisherContext(userId);
  if (!context) return { ok: false as const, code: "FORBIDDEN" as const };
  const { admin, publisher } = context;
  const { data: existing, error: lookupError } = await admin.from("opportunities")
    .select("id,title,description,opportunity_type,city_ar,city_en,country_code,currency,budget,compensation_type,status,published")
    .eq("id", opportunityId).eq("publisher_id", publisher.id).maybeSingle();
  if (lookupError) return { ok: false as const, code: "LOOKUP_FAILED" as const };
  if (!existing) return { ok: false as const, code: "NOT_FOUND" as const };

  const now = new Date().toISOString();

  if (input.action === "publish") {
    if (existing.status === "archived") return { ok: false as const, code: "ARCHIVED" as const };
    if (cleanText(existing.title, 140).length < 4 || cleanText(existing.description, 5000).length < 20) return { ok: false as const, code: "INCOMPLETE_OPPORTUNITY" as const };
    if (!ALLOWED_TYPES.has(String(existing.opportunity_type ?? ""))) return { ok: false as const, code: "INVALID_OPPORTUNITY_TYPE" as const };
    const countryCode = cleanText(existing.country_code || publisher.country_code, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) return { ok: false as const, code: "MISSING_COUNTRY" as const };
    const { data, error } = await admin.from("opportunities").update({ published: true, status: "published", country_code: countryCode, updated_at: now }).eq("id", opportunityId).eq("publisher_id", publisher.id).select("id,status,published").single();
    if (error || !data) return { ok: false as const, code: "UPDATE_FAILED" as const };
    return { ok: true as const, item: { id: Number(data.id), status: data.status, published: Boolean(data.published) } };
  }

  if (input.action === "close" || input.action === "archive") {
    const nextStatus = input.action === "close" ? "closed" : "archived";
    const { data, error } = await admin.from("opportunities").update({ published: false, status: nextStatus, updated_at: now }).eq("id", opportunityId).eq("publisher_id", publisher.id).select("id,status,published").single();
    if (error || !data) return { ok: false as const, code: "UPDATE_FAILED" as const };
    return { ok: true as const, item: { id: Number(data.id), status: data.status, published: Boolean(data.published) } };
  }

  if (existing.status === "archived") return { ok: false as const, code: "ARCHIVED" as const };
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
    const countryCode = cleanText(input.countryCode, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) return { ok: false as const, code: "INVALID_COUNTRY" as const };
    patch.country_code = countryCode; changed = true;
  }
  if (Object.prototype.hasOwnProperty.call(input, "currency")) {
    const currency = cleanText(input.currency, 3).toUpperCase();
    if (currency && !/^[A-Z]{3}$/.test(currency)) return { ok: false as const, code: "INVALID_CURRENCY" as const };
    patch.currency = currency || null; changed = true;
  }
  if (!changed) return { ok: false as const, code: "NO_CHANGES" as const };

  const { data, error } = await admin.from("opportunities").update(patch).eq("id", opportunityId).eq("publisher_id", publisher.id).select("id,status,published").single();
  if (error || !data) return { ok: false as const, code: "UPDATE_FAILED" as const };
  return { ok: true as const, item: { id: Number(data.id), status: data.status, published: Boolean(data.published) } };
}
