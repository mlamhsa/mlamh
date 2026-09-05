import type { CountryCode } from "@/lib/markets/countries";
import { canExposePublicMarket, canExposePublicRecord } from "@/lib/markets/public-access";
import { compareFeaturedThenNewest } from "@/lib/opportunities/featured";
import type { PublicOpportunitiesResponse, PublicOpportunity } from "@/lib/opportunities/public-contract";
import { toPublicOpportunity, type PublicOpportunityRow } from "@/lib/opportunities/public-mapper";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLISHED_STATUSES = ["published", "open"] as const;
const PUBLIC_OPPORTUNITY_SELECT =
  "id,title,title_en,slug,description,description_en,opportunity_type,country_code,currency,city_slug,city_ar,city_en,required_gender,min_age,max_age,required_count,work_date,work_duration,application_start_date,application_deadline,role_requirements,compensation_type,budget,company_name,featured,featured_until,managed_by_mlamh,expires_at,created_at,published,status";

export type PublicOpportunitiesInput = { countryCode: CountryCode; locale: "ar" | "en" };
export type PublicOpportunityDetailInput = PublicOpportunitiesInput & { identifier: string };

function applyMarketFilter<T extends { or: Function; eq: Function }>(query: T, countryCode: CountryCode): T {
  return (countryCode === "SA" ? query.or("country_code.eq.SA,country_code.is.null") : query.eq("country_code", countryCode)) as T;
}

export async function getPublicOpportunities(input: PublicOpportunitiesInput): Promise<PublicOpportunitiesResponse> {
  const { countryCode, locale } = input;
  if (!canExposePublicMarket(countryCode, "publicOpportunities")) return { items: [], market: countryCode, locale };

  const supabase = createAdminClient();
  let query = supabase.from("opportunities").select(PUBLIC_OPPORTUNITY_SELECT).eq("published", true).in("status", [...PUBLISHED_STATUSES]);
  query = applyMarketFilter(query, countryCode);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("[getPublicOpportunities]", error);
    return { items: [], market: countryCode, locale };
  }

  const rows = (data ?? []) as PublicOpportunityRow[];
  const items = rows
    .filter((row) => canExposePublicRecord(row, countryCode, "publicOpportunities"))
    .sort(compareFeaturedThenNewest)
    .map((row) => toPublicOpportunity(row, locale));
  return { items, market: countryCode, locale };
}

export async function getPublicOpportunityByIdentifier(input: PublicOpportunityDetailInput): Promise<PublicOpportunity | null> {
  const { countryCode, locale, identifier } = input;
  const normalizedIdentifier = identifier.trim();
  if (!normalizedIdentifier || !canExposePublicMarket(countryCode, "publicOpportunities")) return null;

  const supabase = createAdminClient();
  let query = supabase.from("opportunities").select(PUBLIC_OPPORTUNITY_SELECT).eq("published", true).in("status", [...PUBLISHED_STATUSES]);
  query = applyMarketFilter(query, countryCode);
  const numericId = Number(normalizedIdentifier);
  query = Number.isInteger(numericId) && numericId > 0 ? query.eq("id", numericId) : query.eq("slug", normalizedIdentifier);
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[getPublicOpportunityByIdentifier]", error);
    return null;
  }

  const row = data as PublicOpportunityRow | null;
  if (!row || !canExposePublicRecord(row, countryCode, "publicOpportunities")) return null;
  return toPublicOpportunity(row, locale);
}
