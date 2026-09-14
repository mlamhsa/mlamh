import type { MetadataRoute } from "next";

import { SceneCMS } from "@/lib/cms/SceneCMS";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { locales } from "@/lib/i18n";
import { canIndexMarket } from "@/lib/markets/seo";
import { isOpportunityOpenForSeo } from "@/lib/seo/opportunity";
import { getPublishedTalents } from "@/lib/supabase/public-talents";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");

const SEO_MARKET = "SA" as const;
const PUBLIC_TALENT_CATEGORY_SLUGS: Set<string> = new Set(
  TALENT_CATEGORIES.map((category) => category.slug),
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!canIndexMarket(SEO_MARKET)) {
    return [];
  }

  // Public helpers below already enforce their own publication/visibility rules.
  // Scene is intentionally fetched in one locale because only ids/slugs are needed
  // to construct equivalent ar/en routes.
  const [talents, opportunities, sceneCategories, sceneArticles] = await Promise.all([
    getPublishedTalents(SEO_MARKET).catch(() => []),
    getPublishedOpportunities(SEO_MARKET).catch(() => []),
    SceneCMS.getPublicCategories("ar").catch(() => []),
    SceneCMS.getPublicArticles({ locale: "ar", limit: 100 }).catch(() => []),
  ]);

  const activeOpportunities = opportunities.filter((opportunity) =>
    isOpportunityOpenForSeo(opportunity),
  );

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    { url: `${SITE_URL}/${locale}`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/${locale}/talent`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/${locale}/opportunities`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/${locale}/scene`, changeFrequency: "daily", priority: 0.88 },
    { url: `${SITE_URL}/${locale}/casting`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/${locale}/publishers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/${locale}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/${locale}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/${locale}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/${locale}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/${locale}/refund-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/${locale}/complaints`, changeFrequency: "yearly", priority: 0.3 },
  ]);

  const sceneCategoryRoutes: MetadataRoute.Sitemap = sceneCategories.flatMap((category) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/scene/category/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.78,
    })),
  );

  const sceneArticleRoutes: MetadataRoute.Sitemap = sceneArticles.flatMap((article) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/scene/${article.slug}`,
      lastModified: article.publishedAt ? new Date(article.publishedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: article.isFeatured ? 0.82 : 0.74,
    })),
  );

  const talentRoutes: MetadataRoute.Sitemap = talents
    .filter((talent) => Boolean(talent.slug))
    .flatMap((talent) => locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/talent/${talent.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })));

  const availableCategories = new Set(
    talents
      .map((talent) => talent.category_slug?.trim())
      .filter(
        (value): value is string =>
          Boolean(value) && PUBLIC_TALENT_CATEGORY_SLUGS.has(value as string),
      ),
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

  const opportunityRoutes: MetadataRoute.Sitemap = activeOpportunities
    .filter((opportunity) => Boolean(opportunity.slug))
    .flatMap((opportunity) => locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/opportunities/${opportunity.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })));

  const opportunityTypes = new Set(activeOpportunities.map((opportunity) => String(opportunity.opportunity_type ?? "")));
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
    ...sceneCategoryRoutes,
    ...sceneArticleRoutes,
    ...talentRoutes,
    ...categoryRoutes,
    ...cityRoutes,
    ...opportunityRoutes,
    ...opportunityIntentRoutes,
  ];
}
