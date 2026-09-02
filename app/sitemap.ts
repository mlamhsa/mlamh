import type { MetadataRoute } from "next";

import { getPublishedTalents } from "@/lib/supabase/public-talents";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import { locales } from "@/lib/i18n";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [talents, opportunities] = await Promise.all([
    getPublishedTalents().catch(() => []),
    getPublishedOpportunities().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    { url: `${SITE_URL}/${locale}`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/${locale}/talent`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/${locale}/opportunities`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/${locale}/casting`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/${locale}/publishers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/${locale}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/${locale}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/${locale}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/${locale}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ]);

  const talentRoutes: MetadataRoute.Sitemap = talents
    .filter((talent) => Boolean(talent.slug))
    .flatMap((talent) => locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/talent/${talent.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })));

  const availableCategories = new Set(
    talents.map((talent) => talent.category_slug?.trim())
      .filter((value): value is string => value === "actor" || value === "model"),
  );

  const categoryRoutes: MetadataRoute.Sitemap = Array.from(availableCategories).flatMap((category) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/talent/category/${category}`,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  );

  const availableCities = new Set(
    talents.map((talent) => talent.city_slug?.trim()).filter((value): value is string => Boolean(value)),
  );

  const cityRoutes: MetadataRoute.Sitemap = Array.from(availableCities).flatMap((city) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/talent/city/${city}`,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  );

  const opportunityRoutes: MetadataRoute.Sitemap = opportunities
    .filter((opportunity) => Boolean(opportunity.slug))
    .flatMap((opportunity) => locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/opportunities/${opportunity.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })));

  const opportunityTypes = new Set(opportunities.map((opportunity) => String(opportunity.opportunity_type ?? "")));
  const intentTypes = [
    opportunityTypes.has("actor") || opportunityTypes.has("actress") || opportunityTypes.has("extra") ? "acting" : null,
    opportunityTypes.has("model") ? "modeling" : null,
  ].filter((value): value is string => Boolean(value));

  const opportunityIntentRoutes: MetadataRoute.Sitemap = intentTypes.flatMap((type) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/opportunities/type/${type}`,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  );

  return [
    ...staticRoutes,
    ...talentRoutes,
    ...categoryRoutes,
    ...cityRoutes,
    ...opportunityRoutes,
    ...opportunityIntentRoutes,
  ];
}
