import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");

type TalentPrivacyMetadata = Talent & {
  profile_visibility?: "public" | "verified_publishers" | "private" | null;
  photo_visibility?: "public" | "verified_publishers" | "private" | null;
  allow_search_indexing?: boolean | null;
};

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
  const privacyTalent = talent as TalentPrivacyMetadata;
  const profileVisibility = privacyTalent.profile_visibility ?? "public";
  const photoVisibility = privacyTalent.photo_visibility ?? "public";
  const isPublicProfile = profileVisibility === "public";
  const mayIndex = privacyTalent.allow_search_indexing !== false && isPublicProfile;
  const mayExposePhoto = isPublicProfile && photoVisibility === "public";

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
    ? `${safeName}${category ? `، ${category}` : ""}. اكتشف الملف المهني عبر منصة ملامح.`
    : `Discover ${safeName}${category ? `, ${category}` : ""}. View the professional profile on MLAMH.`;

  // Non-public profiles must not leak private bio copy into social/search metadata.
  const description = isPublicProfile
    ? cleanMetaDescription(bio, fallbackDescription)
    : isRtl
      ? "ملف موهبة على منصة ملامح. تفاصيل الملف متاحة وفق إعدادات الخصوصية الخاصة بالموهبة."
      : "A talent profile on MLAMH. Profile details are available according to the talent's privacy settings.";

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

  // Never place a restricted talent photo in OG/Twitter metadata.
  const image = mayExposePhoto && talent.image_url
    ? talent.image_url
    : `${SITE_URL}/og-image.png`;

  const isIndexable = Boolean(
    mayIndex &&
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
          height: mayExposePhoto && talent.image_url ? 1600 : 630,
          alt: isPublicProfile ? safeName : (isRtl ? "ملامح" : "MLAMH"),
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
      follow: isPublicProfile,
      noarchive: !isPublicProfile,
      noimageindex: !mayExposePhoto,
    },
  };
}
