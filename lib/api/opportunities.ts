import type { CountryCode } from "@/lib/markets/countries";
import { canExposePublicMarket, canExposePublicRecord } from "@/lib/markets/public-access";
import { compareFeaturedThenNewest } from "@/lib/opportunities/featured";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicOpportunity = {
  id: number;
  title: string;
  slug: string;
  description: string;
  opportunityType: string;
  countryCode: string | null;
  currency: string | null;
  citySlug: string | null;
  city: string | null;
  requiredGender: string | null;
  minAge: number | null;
  maxAge: number | null;
  requiredCount: number | null;
  workDate: string | null;
  workDuration: string | null;
  applicationStartDate: string | null;
  applicationDeadline: string | null;
  roleRequirements: Record<string, unknown>;
  compensationType: "fixed" | "negotiable" | "unpaid" | null;
  budget: string | null;
  companyName: string;
  featured: boolean;
  managedByMlamh: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type PublicOpportunitiesInput = {
  countryCode: CountryCode;
  locale: "ar" | "en";
};

export type PublicOpportunitiesResponse = {
  items: PublicOpportunity[];
  market: CountryCode;
  locale: "ar" | "en";
};

type OpportunityRow = {
  id: number;
  title: string | null;
  title_en: string | null;
  slug: string | null;
  description: string | null;
  description_en: string | null;
  opportunity_type: string | null;
  country_code: CountryCode | null;
  currency: string | null;
  city_slug: string | null;
  city_ar: string | null;
  city_en: string | null;
  required_gender: string | null;
  min_age: number | null;
  max_age: number | null;
  required_count: number | null;
  work_date: string | null;
  work_duration: string | null;
  application_start_date: string | null;
  application_deadline: string | null;
  role_requirements: unknown;
  compensation_type: string | null;
  budget: string | number | null;
  company_name: string | null;
  featured: boolean | null;
  featured_until: string | null;
  managed_by_mlamh: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  published: boolean | null;
  status: string | null;
};

const SELECT = "id,title,title_en,slug,description,description_en,opportunity_type,country_code,currency,city_slug,city_ar,city_en,required_gender,min_age,max_age,required_count,work_date,work_duration,application_start_date,application_deadline,role_requirements,compensation_type,budget,company_name,featured,featured_until,managed_by_mlamh,expires_at,created_at,published,status";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapOpportunity(row: OpportunityRow, locale: "ar" | "en"): PublicOpportunity {
  const title = locale === "en" ? row.title_en || row.title : row.title || row.title_en;
  const description = locale === "en" ? row.description_en || row.description : row.description || row.description_en;
  const city = locale === "en" ? row.city_en || row.city_ar : row.city_ar || row.city_en;
  const compensationType = row.compensation_type === "fixed" || row.compensation_type === "negotiable" || row.compensation_type === "unpaid"
    ? row.compensation_type
    : null;

  return {
    id: Number(row.id),
    title: title || "Opportunity",
    slug: row.slug || String(row.id),
    description: description || "",
    opportunityType: row.opportunity_type || "casting",
    countryCode: row.country_code ?? "SA",
    currency: row.currency ?? null,
    citySlug: row.city_slug ?? null,
    city: city ?? null,
    requiredGender: row.required_gender ?? null,
    minAge: row.min_age ?? null,
    maxAge: row.max_age ?? null,
    requiredCount: row.required_count ?? null,
    workDate: row.work_date ?? null,
    workDuration: row.work_duration ?? null,
    applicationStartDate: row.application_start_date ?? null,
    applicationDeadline: row.application_deadline ?? null,
    roleRequirements: asRecord(row.role_requirements),
    compensationType,
    budget: row.budget === null || row.budget === undefined ? null : String(row.budget),
    companyName: row.company_name || "MLAMH",
    featured: Boolean(row.featured),
    managedByMlamh: Boolean(row.managed_by_mlamh),
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at || new Date(0).toISOString(),
  };
}

export async function getOpportunities(
  input: PublicOpportunitiesInput = { countryCode: "SA", locale: "ar" },
): Promise<PublicOpportunitiesResponse> {
  const { countryCode, locale } = input;
  if (!canExposePublicMarket(countryCode, "publicOpportunities")) {
    return { items: [], market: countryCode, locale };
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("opportunities")
    .select(SELECT)
    .eq("published", true)
    .in("status", ["published", "open"]);

  query = countryCode === "SA"
    ? query.or("country_code.eq.SA,country_code.is.null")
    : query.eq("country_code", countryCode);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("[getOpportunities]", error);
    return { items: [], market: countryCode, locale };
  }

  const rows = (data ?? []) as OpportunityRow[];
  const items = rows
    .filter((row) => canExposePublicRecord(row, countryCode, "publicOpportunities"))
    .sort(compareFeaturedThenNewest)
    .map((row) => mapOpportunity(row, locale));

  return { items, market: countryCode, locale };
}
