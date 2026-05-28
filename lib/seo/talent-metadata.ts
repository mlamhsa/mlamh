import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

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

  const title = `${name || "Talent"} | MLAMH`;

  const description =
    bio?.slice(0, 155) ||
    `${name || "Talent"}${category ? ` — ${category}` : ""} on MLAMH.`;

  const image = talent.image_url || undefined;

  const path = talent.slug
    ? `/${locale}/talent/${talent.slug}`
    : `/${locale}/talent`;

  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "MLAMH",
      type: "profile",
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 1600,
              alt: name || "Talent profile image",
            },
          ]
        : undefined,
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: {
      index: Boolean(
        talent.slug &&
          talent.published &&
          talent.status === "approved"
      ),
      follow: true,
    },
  };
}