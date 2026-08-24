import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");

function cleanMetaDescription(
  value: string | null | undefined,
  fallback: string,
) {
  const cleaned = value
    ?.replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.length > 160
    ? `${cleaned.slice(0, 157).trimEnd()}...`
    : cleaned;
}

export function buildTalentMetadata({
  talent,
  locale,
}: {
  talent: Talent;
  locale: Locale;
}): Metadata {
  const isRtl = locale === "ar";

  const name = isRtl
    ? talent.name_ar || talent.name_en
    : talent.name_en || talent.name_ar;

  const category = isRtl
    ? talent.category_ar || talent.category_en
    : talent.category_en || talent.category_ar;

  const bio = isRtl
    ? talent.bio_ar || talent.bio_en
    : talent.bio_en || talent.bio_ar;

  const safeName =
    name || (isRtl ? "موهبة" : "Talent");

  const title = isRtl
    ? `${safeName}${category ? ` — ${category}` : ""} | ملامح`
    : `${safeName}${category ? ` — ${category}` : ""} | MLAMH`;

  const fallbackDescription = isRtl
    ? `${safeName}${category ? `، ${category}` : ""}. اكتشف الملف المهني والصور والمعلومات عبر منصة ملامح.`
    : `Discover ${safeName}${category ? `, ${category}` : ""}. View the professional profile, media and details on MLAMH.`;

  const description = cleanMetaDescription(
    bio,
    fallbackDescription,
  );

  const canonicalSlug = talent.slug || "";

  const canonicalUrl = canonicalSlug
    ? `${SITE_URL}/${locale}/talent/${encodeURIComponent(
        canonicalSlug,
      )}`
    : `${SITE_URL}/${locale}/talent`;

  const arUrl = canonicalSlug
    ? `${SITE_URL}/ar/talent/${encodeURIComponent(
        canonicalSlug,
      )}`
    : `${SITE_URL}/ar/talent`;

  const enUrl = canonicalSlug
    ? `${SITE_URL}/en/talent/${encodeURIComponent(
        canonicalSlug,
      )}`
    : `${SITE_URL}/en/talent`;

  const image =
    talent.image_url || `${SITE_URL}/og-image.png`;

  const isIndexable = Boolean(
    talent.slug &&
      talent.published &&
      talent.status === "approved",
  );

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
      languages: {
        "ar-SA": arUrl,
        en: enUrl,
        "x-default": arUrl,
      },
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: isRtl ? "ملامح" : "MLAMH",
      type: "profile",
      locale: isRtl ? "ar_SA" : "en_US",
      images: [
        {
          url: image,
          width: 1200,
          height: talent.image_url ? 1600 : 630,
          alt: safeName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },

    robots: {
      index: isIndexable,
      follow: true,
    },
  };
}