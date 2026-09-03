import type { CountryCode } from "@/lib/markets/countries";
import {
  canExposePublicMarket,
  canExposePublicRecord,
} from "@/lib/markets/public-access";
import { compareFeaturedThenNewest } from "@/lib/opportunities/featured";
import type { PublicOpportunitiesResponse } from "@/lib/opportunities/public-contract";
import {
  toPublicOpportunity,
  type PublicOpportunityRow,
} from "@/lib/opportunities/public-mapper";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLISHED_STATUSES = ["published", "open"] as const;

export type PublicOpportunitiesInput = {
  countryCode: CountryCode;
  locale: "ar" | "en";
};

function applyMarketFilter<T extends { or: Function; eq: Function }>(
  query: T,
  countryCode: CountryCode,
): T {
  return (countryCode === "SA"
    ? query.or("country_code.eq.SA,country_code.is.null")
    : query.eq("country_code", countryCode)) as T;
}

export async function getPublicOpportunities(
  input: PublicOpportunitiesInput,
): Promise<PublicOpportunitiesResponse> {
  const { countryCode, locale } = input;

  if (!canExposePublicMarket(countryCode, "publicOpportunities")) {
    return { items: [], market: countryCode, locale };
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("opportunities")
    .select(
      "id,title,title_en,slug,description,description_en,opportunity_type,country_code,currency,city_slug,city_ar,city_en,required_gender,min_age,max_age,compensation_type,budget,company_name,featured,featured_until,managed_by_mlamh,expires_at,created_at,published,status",
    )
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES]);

  query = applyMarketFilter(query, countryCode);

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("[getPublicOpportunities]", error);
    return { items: [], market: countryCode, locale };
  }

  const rows = (data ?? []) as PublicOpportunityRow[];
  const items = rows
    .filter((row) =>
      canExposePublicRecord(row, countryCode, "publicOpportunities"),
    )
    .sort(compareFeaturedThenNewest)
    .map((row) => toPublicOpportunity(row, locale));

  return { items, market: countryCode, locale };
}
