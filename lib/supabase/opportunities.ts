import { headers } from "next/headers";

import type { CountryCode } from "@/lib/markets/countries";
import {
  canExposePublicMarket,
  canExposePublicRecord,
} from "@/lib/markets/public-access";
import { compareFeaturedThenNewest } from "@/lib/opportunities/featured";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/lib/types/opportunity";

const PUBLISHED_STATUSES = ["published", "open"] as const;
const DEFAULT_PUBLIC_MARKET: CountryCode = "SA";

export type PublisherInviteOpportunity = {
  id: number;
  title: string;
  title_en?: string | null;
  slug: string;
  opportunity_type: string | null;
  city_ar: string | null;
  city_en: string | null;
  status: string;
  published: boolean;
  created_at: string;
  country_code?: CountryCode | null;
};

async function getOpportunityLocale(): Promise<"ar" | "en"> {
  try {
    const requestHeaders = await headers();
    return requestHeaders.get("x-mlamh-locale") === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

function localizeOpportunity(
  opportunity: Opportunity,
  locale: "ar" | "en",
): Opportunity {
  if (locale !== "en") return opportunity;
  return {
    ...opportunity,
    title: opportunity.title_en?.trim() || opportunity.title,
    description: opportunity.description_en?.trim() || opportunity.description,
  };
}

function applyOpportunityMarketFilter<T extends { or: Function; eq: Function }>(
  query: T,
  countryCode: CountryCode,
): T {
  return (countryCode === "SA"
    ? query.or("country_code.eq.SA,country_code.is.null")
    : query.eq("country_code", countryCode)) as T;
}

export async function getPublishedOpportunities(
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Opportunity[]> {
  if (!canExposePublicMarket(countryCode, "publicOpportunities")) return [];

  const supabase = createAdminClient();
  const locale = await getOpportunityLocale();
  let query = supabase
    .from("opportunities")
    .select("*")
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES]);
  query = applyOpportunityMarketFilter(query, countryCode);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("[getPublishedOpportunities]", error);
    return [];
  }

  return ((data ?? []) as Opportunity[])
    .filter((opportunity) => canExposePublicRecord(opportunity, countryCode, "publicOpportunities"))
    .map((opportunity) => localizeOpportunity(opportunity, locale))
    .sort(compareFeaturedThenNewest);
}

export async function getPublishedOpportunitiesByPublisher(
  publisherId: number,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<PublisherInviteOpportunity[]> {
  if (!Number.isInteger(publisherId) || publisherId <= 0) return [];
  if (!canExposePublicMarket(countryCode, "publicOpportunities")) return [];

  const supabase = createAdminClient();
  const locale = await getOpportunityLocale();
  let query = supabase
    .from("opportunities")
    .select("*")
    .eq("publisher_id", publisherId)
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES]);
  query = applyOpportunityMarketFilter(query, countryCode);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    console.error("[getPublishedOpportunitiesByPublisher]", error);
    return [];
  }

  return ((data ?? []) as Opportunity[])
    .filter((opportunity) => canExposePublicRecord(opportunity, countryCode, "publicOpportunities"))
    .map((opportunity): PublisherInviteOpportunity => ({
      id: opportunity.id,
      title: locale === "en" ? opportunity.title_en?.trim() || opportunity.title : opportunity.title,
      title_en: opportunity.title_en ?? null,
      slug: opportunity.slug,
      opportunity_type: opportunity.opportunity_type ?? null,
      city_ar: opportunity.city_ar ?? null,
      city_en: opportunity.city_en ?? null,
      status: opportunity.status,
      published: opportunity.published,
      created_at: opportunity.created_at,
      country_code: opportunity.country_code ?? null,
    }));
}

export async function getOpportunityBySlug(
  slug: string,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Opportunity | null> {
  if (!canExposePublicMarket(countryCode, "publicOpportunities")) return null;

  const supabase = createAdminClient();
  const locale = await getOpportunityLocale();
  let query = supabase
    .from("opportunities")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES]);
  query = applyOpportunityMarketFilter(query, countryCode);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[getOpportunityBySlug]", error);
    return null;
  }
  if (!data) return null;

  const opportunity = data as Opportunity;
  if (!canExposePublicRecord(opportunity, countryCode, "publicOpportunities")) return null;
  return localizeOpportunity(opportunity, locale);
}

export async function getPublishedOpportunityByIdentifier(
  identifier: string,
  countryCode: CountryCode = DEFAULT_PUBLIC_MARKET,
): Promise<Opportunity | null> {
  const value = identifier.trim();
  if (!value) return null;
  if (!canExposePublicMarket(countryCode, "publicOpportunities")) return null;

  const supabase = createAdminClient();
  const locale = await getOpportunityLocale();
  let query = supabase
    .from("opportunities")
    .select("*")
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES]);
  query = applyOpportunityMarketFilter(query, countryCode);

  if (/^\d+$/.test(value)) query = query.eq("id", Number(value));
  else query = query.eq("slug", value);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("[getPublishedOpportunityByIdentifier]", error);
    return null;
  }
  if (!data) return null;

  const opportunity = data as Opportunity;
  if (!canExposePublicRecord(opportunity, countryCode, "publicOpportunities")) return null;
  return localizeOpportunity(opportunity, locale);
}
