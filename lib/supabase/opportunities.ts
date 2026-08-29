import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/lib/types/opportunity";

const PUBLISHED_STATUSES = ["published", "open"] as const;

export type PublisherInviteOpportunity = {
  id: number;
  title: string;
  slug: string;
  opportunity_type: string | null;
  city_ar: string | null;
  city_en: string | null;
  status: string;
  published: boolean;
  created_at: string;
};

function prioritizeActiveFeaturedOpportunities(opportunities: Opportunity[]) {
  const now = Date.now();

  return opportunities.sort((a, b) => {
    const aFeatured =
      a.featured === true &&
      (!a.featured_until || Date.parse(a.featured_until) > now);
    const bFeatured =
      b.featured === true &&
      (!b.featured_until || Date.parse(b.featured_until) > now);

    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

export async function getPublishedOpportunities(): Promise<Opportunity[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPublishedOpportunities]", error);
    return [];
  }

  return prioritizeActiveFeaturedOpportunities((data ?? []) as Opportunity[]);
}

export async function getPublishedOpportunitiesByPublisher(
  publisherId: number,
): Promise<PublisherInviteOpportunity[]> {
  if (!Number.isInteger(publisherId) || publisherId <= 0) {
    return [];
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select(`
      id,
      title,
      slug,
      opportunity_type,
      city_ar,
      city_en,
      status,
      published,
      created_at
    `)
    .eq("publisher_id", publisherId)
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[getPublishedOpportunitiesByPublisher]",
      error,
    );

    return [];
  }

  return (data ?? []) as PublisherInviteOpportunity[];
}

export async function getOpportunityBySlug(
  slug: string,
): Promise<Opportunity | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .in("status", [...PUBLISHED_STATUSES])
    .maybeSingle();

  if (error) {
    console.error("[getOpportunityBySlug]", error);
    return null;
  }

  return data as Opportunity | null;
}