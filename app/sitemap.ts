import type { MetadataRoute } from "next";
import { getPublishedTalents } from "@/lib/supabase/public-talents";
import { locales } from "@/lib/i18n";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const talents = await getPublishedTalents();

  const staticRoutes = locales.flatMap((locale) => [
    {
      url: `${SITE_URL}/${locale}`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/${locale}/talent`,
      lastModified: now,
    },
    {
      url: `${SITE_URL}/${locale}/join`,
      lastModified: now,
    },
  ]);

  const talentRoutes = talents
    .filter((talent) => Boolean(talent.slug))
    .flatMap((talent) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/talent/${talent.slug}`,
        lastModified: now,
      }))
    );

  return [...staticRoutes, ...talentRoutes];
}