import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { PublicTalentGallery } from "@/components/public/PublicTalentGallery";
import { ProfileShareButton } from "@/components/public/ProfileShareButton";
import { PublisherTalentInvitePanel } from "@/components/publisher/PublisherTalentInvitePanel";

import { getCurrentAccountType } from "@/lib/auth/get-current-account-type";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildTalentMetadata } from "@/lib/seo/talent-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublishedTalentBySlug,
  getPublishedTalents,
} from "@/lib/supabase/public-talents";
import {
  getTalentBio,
  getTalentCategory,
  getTalentCity,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";
import { talentPath } from "@/lib/utils/routes";
import { normalizeInstagramUrl } from "@/lib/utils/social-links";
import { getRelatedTalents } from "@/lib/utils/talent-selectors";
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");
import {
  hasDisplayValue,
  translateTalentValue,
  translateTalentValues,
} from "@/lib/utils/talent-translations";

const EYE_COLOR_LABELS: Record<string, { ar: string; en: string }> = {
  brown: { ar: "بني", en: "Brown" },
  black: { ar: "أسود", en: "Black" },
  blue: { ar: "أزرق", en: "Blue" },
  green: { ar: "أخضر", en: "Green" },
  hazel: { ar: "عسلي", en: "Hazel" },
  gray: { ar: "رمادي", en: "Gray" },
};

const HAIR_COLOR_LABELS: Record<string, { ar: string; en: string }> = {
  black: { ar: "أسود", en: "Black" },
  brown: { ar: "بني", en: "Brown" },
  blonde: { ar: "أشقر", en: "Blonde" },
  red: { ar: "أحمر", en: "Red" },
  gray: { ar: "رمادي", en: "Gray" },
  white: { ar: "أبيض", en: "White" },
  dyed: { ar: "مصبوغ", en: "Dyed" },
  bald: { ar: "أصلع", en: "Bald" },
};

const HAIR_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  straight: { ar: "ناعم", en: "Straight" },
  wavy: { ar: "مموج", en: "Wavy" },
  curly: { ar: "مجعد", en: "Curly" },
  coily: { ar: "ملفوف", en: "Coily" },
  bald: { ar: "أصلع", en: "Bald" },
  covered: { ar: "مغطى", en: "Covered" },
};

const SKIN_COLOR_LABELS: Record<string, { ar: string; en: string }> = {
  fair: { ar: "فاتح", en: "Fair" },
  light: { ar: "فاتح نسبيًا", en: "Light" },
  medium: { ar: "متوسط", en: "Medium" },
  olive: { ar: "زيتوني", en: "Olive" },
  tan: { ar: "برونزي", en: "Tan" },
  brown: { ar: "بني", en: "Brown" },
  dark: { ar: "غامق", en: "Dark" },
};

const CLOTHING_SIZE_LABELS: Record<string, { ar: string; en: string }> = {
  XS: { ar: "صغير جدًا", en: "XS" },
  S: { ar: "صغير", en: "S" },
  M: { ar: "متوسط", en: "M" },
  L: { ar: "كبير", en: "L" },
  XL: { ar: "كبير جدًا", en: "XL" },
  XXL: { ar: "كبير جدًا جدًا", en: "XXL" },
};

function formatOption(
  value: string | null | undefined,
  labels?: Record<string, { ar: string; en: string }>,
  isRtl?: boolean,
) {
  if (!value?.trim()) return null;

  const normalizedValue = value.trim();
  const normalizedKey = normalizedValue.toLowerCase();

  if (labels && isRtl !== undefined) {
    const item =
      labels[normalizedValue] ??
      labels[normalizedKey] ??
      labels[normalizedValue.toUpperCase()];

    if (!item) return formatTag(normalizedValue);

    return isRtl ? item.ar : item.en;
  }

  return formatTag(normalizedValue);
}

function formatBoolean(value: boolean | null | undefined, isRtl: boolean) {
  if (value === null || value === undefined) return null;
  return value ? (isRtl ? "نعم" : "Yes") : isRtl ? "لا" : "No";
}

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam)) {
    return {};
  }

  const locale = localeParam as Locale;
  const talent = await getPublishedTalentBySlug(slug);

  if (!talent) {
    return {};
  }

  return buildTalentMetadata({ talent, locale });
}

function sanitizeExternalUrl(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();

  if (
    ["/", "#", "null", "undefined", "n/a", "na"].includes(lowered) ||
    lowered.includes("localhost") ||
    lowered.includes("127.0.0.1")
  ) {
    return null;
  }

  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : trimmed.includes(".")
        ? `https://${trimmed}`
        : null;

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizePlatformUrl(
  value: string | null | undefined,
  platform: "tiktok" | "snapchat",
) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();

  if (
    ["/", "#", "null", "undefined", "n/a", "na"].includes(lowered) ||
    lowered.includes("localhost") ||
    lowered.includes("127.0.0.1")
  ) {
    return null;
  }

  const directUrl = sanitizeExternalUrl(trimmed);

  if (directUrl) {
    return directUrl;
  }

  const username = trimmed
    .replace(/^@/, "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  if (
    !username ||
    username.includes(" ") ||
    username.includes(":") ||
    username.includes("\\")
  ) {
    return null;
  }

  return platform === "tiktok"
    ? `https://www.tiktok.com/@${encodeURIComponent(username)}`
    : `https://www.snapchat.com/add/${encodeURIComponent(username)}`;
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function formatGender(value: string | null | undefined, isRtl: boolean) {
  if (value === "male") {
    return isRtl ? "ذكر" : "Male";
  }

  if (value === "female") {
    return isRtl ? "أنثى" : "Female";
  }

  return null;
}

function formatTag(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMeasurement(
  value: string | number | null | undefined,
  suffix: string,
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return `${value} ${suffix}`;
}

export default async function TalentProfilePage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam) || !slug?.trim()) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const [talent, accountType] = await Promise.all([
    getPublishedTalentBySlug(slug),
    getCurrentAccountType(),
  ]);

  if (!talent) {
    notFound();
  }

  const adminClient = createAdminClient();

  await adminClient.rpc("increment_talent_view", {
    p_talent_id: talent.id,
  });

  const allTalents = await getPublishedTalents();
  const relatedTalents = getRelatedTalents(allTalents, talent).slice(0, 3);

  const instagramUrl = sanitizeExternalUrl(
    normalizeInstagramUrl(talent.instagram),
  );
  const tiktokUrl = normalizePlatformUrl(talent.tiktok, "tiktok");
  const snapchatUrl = normalizePlatformUrl(talent.snapchat, "snapchat");
  const portfolioUrl = sanitizeExternalUrl(talent.portfolio_url);

  const gallery = normalizeGalleryImages(talent.gallery_images);

  const canRequestTalent = accountType === "publisher";
  const isGuest = accountType === null;
  const isTalentAccount = accountType === "talent";

  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);
  const bio = getTalentBio(talent, locale);
  const talentUrl = `${SITE_URL}/${locale}/talent/${talent.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${talentUrl}#person`,
    url: talentUrl,
    name: name || undefined,
    description: bio || undefined,
    image: talent.image_url || undefined,
    jobTitle: category || undefined,
    address: city
      ? {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: "SA",
        }
      : undefined,
    sameAs: [
      instagramUrl,
      tiktokUrl,
      snapchatUrl,
      portfolioUrl,
    ].filter((url): url is string => Boolean(url)),
  };

  const age = calculateAge(talent.date_of_birth);
  const gender = formatGender(talent.gender, isRtl);
  const nationality = translateTalentValue(
    locale,
    "nationality",
    talent.nationality,
  );

  const languages = translateTalentValues(locale, "language", talent.languages);
  const dialects = translateTalentValues(locale, "dialect", talent.dialects);
  const skills = translateTalentValues(locale, "skill", talent.skills);

  const availabilityMap: Record<string, string> = {
    available_now: isRtl ? "متاح حاليًا" : "Available Now",
    available_this_week: isRtl ? "متاح هذا الأسبوع" : "Available This Week",
    available_next_month: isRtl ? "متاح الشهر القادم" : "Available Next Month",
    unavailable: isRtl ? "غير متاح حاليًا" : "Unavailable",
  };

  const availability = talent.availability_status
    ? availabilityMap[talent.availability_status] || null
    : null;

  const appearanceItems = [
    {
      label: isRtl ? "لون العين" : "Eye Color",
      value: formatOption(talent.eye_color, EYE_COLOR_LABELS, isRtl),
    },
    {
      label: isRtl ? "لون الشعر" : "Hair Color",
      value: formatOption(talent.hair_color, HAIR_COLOR_LABELS, isRtl),
    },
    {
      label: isRtl ? "نوع الشعر" : "Hair Type",
      value: formatOption(talent.hair_type, HAIR_TYPE_LABELS, isRtl),
    },
    {
      label: isRtl ? "لون البشرة" : "Skin Color",
      value: formatOption(talent.skin_color, SKIN_COLOR_LABELS, isRtl),
    },
  ].filter((item) => hasDisplayValue(item.value));

  const measurementItems = [
    {
      label: isRtl ? "الطول" : "Height",
      value: formatMeasurement(talent.height_cm, isRtl ? "سم" : "cm"),
    },
    {
      label: isRtl ? "الوزن" : "Weight",
      value: formatMeasurement(talent.weight_kg, isRtl ? "كجم" : "kg"),
    },
    {
      label: isRtl ? "مقاس الملابس" : "Clothing Size",
      value: formatOption(talent.clothing_size, CLOTHING_SIZE_LABELS, isRtl),
    },
    {
      label: isRtl ? "مقاس الحذاء" : "Shoe Size",
      value: talent.shoe_size,
    },
    {
      label: isRtl ? "مقاس الصدر" : "Chest Size",
      value: talent.chest_size,
    },
    {
      label: isRtl ? "مقاس الخصر" : "Waist Size",
      value: talent.waist_size,
    },
    {
      label: isRtl ? "مقاس الورك" : "Hip Size",
      value: talent.hip_size,
    },
  ].filter((item) => hasDisplayValue(item.value));

  const experienceItems = [
    {
      label: isRtl ? "سنوات الخبرة" : "Experience Years",
      value: talent.experience_years,
    },
    {
      label: isRtl ? "مستعد للسفر" : "Ready to Travel",
      value: formatBoolean(talent.ready_to_travel, isRtl),
    },
    {
      label: isRtl ? "يمتلك جواز سفر" : "Has Passport",
      value: formatBoolean(talent.has_passport, isRtl),
    },
    {
      label: isRtl ? "يمتلك سيارة" : "Has Car",
      value: formatBoolean(talent.has_car, isRtl),
    },
    {
      label: isRtl ? "العمل خارج المدينة" : "Work Outside City",
      value: formatBoolean(talent.work_outside_city, isRtl),
    },
    {
      label: isRtl ? "العمل خارج الدولة" : "Work Outside Country",
      value: formatBoolean(talent.work_outside_country, isRtl),
    },
  ].filter((item) => hasDisplayValue(item.value));

  const socialLinks = Array.from(
    new Map(
      [
        instagramUrl
          ? {
              href: instagramUrl,
              label: isRtl ? "إنستغرام" : "Instagram",
            }
          : null,
        tiktokUrl
          ? {
              href: tiktokUrl,
              label: isRtl ? "تيك توك" : "TikTok",
            }
          : null,
        snapchatUrl
          ? {
              href: snapchatUrl,
              label: isRtl ? "سناب شات" : "Snapchat",
            }
          : null,
        portfolioUrl
          ? {
              href: portfolioUrl,
              label: isRtl ? "معرض الأعمال" : "Portfolio",
            }
          : null,
      ]
        .filter(
          (
            item,
          ): item is {
            href: string;
            label: string;
          } => Boolean(item?.href),
        )
        .filter(
          (item) =>
            !item.href.includes("localhost") &&
            !item.href.includes("127.0.0.1"),
        )
        .map((item) => [item.href, item]),
    ).values(),
  );

  return (
  <main
    className="min-h-screen overflow-x-hidden bg-background pb-24 text-white lg:pb-0"
    dir={isRtl ? "rtl" : "ltr"}
  >
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />

    <Navbar locale={locale} />

      <section className="relative overflow-hidden pb-16 pt-16 sm:pb-20 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,98,0.1),transparent_42%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={talentPath(locale)}
            className={`inline-flex items-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[10px] text-gold transition duration-300 hover:border-gold/35 hover:bg-gold/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
              isRtl ? "tracking-normal" : "uppercase tracking-[0.24em]"
            }`}
          >
            {isRtl ? "العودة للمواهب" : "Back to talents"}
          </Link>

          <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/20 sm:mt-7 sm:rounded-[2.25rem]">
            <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="min-w-0 border-b border-white/10 p-3 sm:p-4 lg:border-b-0 lg:border-e">
                <div className="lg:sticky lg:top-28">
                  <PublicTalentGallery
                    imageUrl={talent.image_url}
                    galleryImages={gallery}
                    alt={name || "Talent image"}
                    locale={locale}
                  />
                </div>
              </div>

              <div className="min-w-0 p-5 sm:p-7 lg:p-8 xl:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  {talent.verified ? (
                    <StatusPill tone="success" isRtl={isRtl}>
                      ✓ {isRtl ? "موثق" : "Verified"}
                    </StatusPill>
                  ) : null}

                  {talent.featured ? (
                    <StatusPill tone="gold" isRtl={isRtl}>
                      {isRtl ? "موهبة مميزة" : "Featured Talent"}
                    </StatusPill>
                  ) : null}

                  {availability ? (
                    <StatusPill tone="neutral" isRtl={isRtl}>
                      {availability}
                    </StatusPill>
                  ) : null}
                </div>

                <h1
                  className={`mt-5 break-words text-[clamp(2.5rem,8vw,5.5rem)] font-light leading-[1.06] text-white ${
                    isRtl ? "tracking-normal" : "tracking-tight"
                  }`}
                  style={{
                    fontFamily: isRtl
                      ? "var(--font-noto-arabic)"
                      : "var(--font-cormorant)",
                  }}
                >
                  {name || (isRtl ? "موهبة غير مسماة" : "Unnamed Talent")}
                </h1>

                <p className="mt-3 text-sm leading-7 text-white/60 sm:text-base">
                  {[category, city].filter(Boolean).join(" • ")}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:grid-cols-3">
                  <MiniFact
                    label={isRtl ? "التصنيف" : "Category"}
                    value={category}
                    isRtl={isRtl}
                  />
                  <MiniFact
                    label={isRtl ? "المدينة" : "City"}
                    value={city}
                    isRtl={isRtl}
                  />
                  <MiniFact
                    label={isRtl ? "الحالة" : "Availability"}
                    value={availability}
                    isRtl={isRtl}
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {canRequestTalent ? (
                    <a
                      href="#request-talent"
                      className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-gold px-6 text-xs font-medium text-black transition duration-300 hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-none"
                    >
                      {isRtl ? "دعوة الموهبة" : "Invite Talent"}
                    </a>
                  ) : isGuest ? (
                    <Link
                      href={`/${locale}/login`}
                      className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-gold px-6 text-xs font-medium text-black transition duration-300 hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-none"
                    >
                      {isRtl ? "تسجيل الدخول للتواصل" : "Sign in to contact"}
                    </Link>
                  ) : isTalentAccount ? (
                    <span className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-center text-xs leading-6 text-white/45">
                      {isRtl
                        ? "حسابات المواهب لا ترسل طلبات مواهب"
                        : "Talent accounts cannot request talents"}
                    </span>
                  ) : null}

                  <ProfileShareButton
                    locale={locale}
                    title={name || "MLAMH Talent"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-start">
            <div className="space-y-5">
              {bio ? (
                <ContentCard
                  eyebrow={isRtl ? "عن الموهبة" : "About the talent"}
                  title={isRtl ? "نبذة" : "Biography"}
                  isRtl={isRtl}
                >
                  <p
                    className="max-w-3xl whitespace-pre-line text-sm leading-7 text-white/65 sm:text-base sm:leading-8"
                    style={{
                      fontFamily: isRtl ? "var(--font-noto-arabic)" : undefined,
                    }}
                  >
                    {bio}
                  </p>
                </ContentCard>
              ) : null}

              <DetailsCard
                eyebrow={isRtl ? "معلومات أساسية" : "Basic Information"}
                title={isRtl ? "عن الموهبة" : "Talent Overview"}
                isRtl={isRtl}
                items={[
                  {
                    label: isRtl ? "الجنسية" : "Nationality",
                    value: nationality,
                  },
                  { label: isRtl ? "العمر" : "Age", value: age },
                  { label: isRtl ? "الجنس" : "Gender", value: gender },
                ].filter((item) => hasDisplayValue(item.value))}
              />

              {languages.length > 0 ||
              dialects.length > 0 ||
              skills.length > 0 ? (
                <ContentCard
                  eyebrow={isRtl ? "القدرات" : "Capabilities"}
                  title={isRtl ? "اللغات والمهارات" : "Languages & Skills"}
                  isRtl={isRtl}
                >
                  <div className="space-y-5">
                    <TagGroup
                      title={isRtl ? "اللغات" : "Languages"}
                      values={languages}
                    />
                    <TagGroup
                      title={isRtl ? "اللهجات" : "Dialects"}
                      values={dialects}
                    />
                    <TagGroup
                      title={isRtl ? "المهارات" : "Skills"}
                      values={skills}
                    />
                  </div>
                </ContentCard>
              ) : null}

              {appearanceItems.length > 0 ? (
                <DetailsCard
                  eyebrow={isRtl ? "تفاصيل الموهبة" : "Talent Details"}
                  title={isRtl ? "المظهر" : "Appearance"}
                  isRtl={isRtl}
                  items={appearanceItems}
                />
              ) : null}

              {experienceItems.length > 0 ? (
                <DetailsCard
                  eyebrow={isRtl ? "الجاهزية للعمل" : "Work Readiness"}
                  title={isRtl ? "الخبرة والتنقل" : "Experience & Mobility"}
                  isRtl={isRtl}
                  items={experienceItems}
                />
              ) : null}

              {measurementItems.length > 0 ? (
                <DetailsCard
                  eyebrow={isRtl ? "تفاصيل الموهبة" : "Talent Details"}
                  title={isRtl ? "المقاسات" : "Measurements"}
                  isRtl={isRtl}
                  items={measurementItems}
                />
              ) : null}

              {talent.video_intro || talent.showreel_url ? (
                <ContentCard
                  eyebrow={isRtl ? "المحتوى المرئي" : "Media"}
                  title={isRtl ? "الفيديو" : "Video"}
                  isRtl={isRtl}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sanitizeExternalUrl(talent.video_intro) ? (
                      <ActionLink
                        href={sanitizeExternalUrl(talent.video_intro)!}
                      >
                        {isRtl
                          ? "مشاهدة الفيديو التعريفي"
                          : "Watch Video Intro"}
                      </ActionLink>
                    ) : null}

                    {sanitizeExternalUrl(talent.showreel_url) ? (
                      <ActionLink
                        href={sanitizeExternalUrl(talent.showreel_url)!}
                      >
                        {isRtl ? "مشاهدة عرض الأعمال" : "Watch Showreel"}
                      </ActionLink>
                    ) : null}
                  </div>
                </ContentCard>
              ) : null}

              {socialLinks.length > 0 ? (
                <ContentCard
                  eyebrow={isRtl ? "روابط الموهبة" : "Talent Links"}
                  title={isRtl ? "التواصل والمتابعة" : "Connect & Follow"}
                  isRtl={isRtl}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {socialLinks.map((item, index) => (
                      <ActionLink
                        key={`${item.label}-${item.href}-${index}`}
                        href={item.href}
                      >
                        {item.label}
                      </ActionLink>
                    ))}
                  </div>
                </ContentCard>
              ) : null}
            </div>

            {canRequestTalent ? (
              <div
                id="request-talent"
                className="scroll-mt-28 lg:sticky lg:top-28"
              >
                <div className="overflow-hidden rounded-[1.75rem] border border-gold/20 bg-[linear-gradient(145deg,rgba(201,169,98,0.09),rgba(255,255,255,0.02))] p-4 shadow-2xl shadow-black/20 sm:p-5">
                  <div className="mb-5 px-1">
                    <p
                      className={`text-[10px] text-gold ${
                        isRtl
                          ? "tracking-normal"
                          : "uppercase tracking-[0.28em]"
                      }`}
                    >
                      {isRtl ? "ابدأ مشروعك" : "Start your project"}
                    </p>
                    <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
                      {isRtl ? "دعوة هذه الموهبة" : "Invite this talent"}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/45">
                      {isRtl
                        ? "أرسل تفاصيل مشروعك، وسيتم التواصل معك لمتابعة الدعوة."
                        : "Share your project details and the team will follow up on the invitation."}
                    </p>
                    <p className="mt-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-xs leading-6 text-white/40">
                      {isRtl
                        ? "يتم التواصل الأولي وإدارة الطلب عبر ملامح لحماية خصوصية الطرفين وتنظيم التعاون."
                        : "Initial contact and request management take place through MLAMH to protect both parties and organize the collaboration."}
                    </p>
                  </div>

                  <PublisherTalentInvitePanel
  talentId={talent.id}
  locale={locale}
/>
                </div>
              </div>
            ) : isGuest ? (
              <div className="lg:sticky lg:top-28">
                <div className="rounded-[1.75rem] border border-gold/20 bg-gold/[0.05] p-5 text-center sm:p-6">
                  <p className="text-xs text-gold">
                    {isRtl ? "التواصل مع الموهبة" : "Contact the talent"}
                  </p>
                  <h2 className="mt-3 text-2xl font-light">
                    {isRtl ? "سجّل الدخول أولًا" : "Sign in first"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/45">
                    {isRtl
                      ? "يجب تسجيل الدخول بحساب ناشر لإرسال دعوة لهذه الموهبة."
                      : "Sign in with a publisher account to invite this talent."}
                  </p>
                  <Link
                    href={`/${locale}/login`}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gold px-5 text-sm font-medium text-black transition duration-300 hover:bg-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
                  >
                    {isRtl ? "تسجيل الدخول" : "Sign in"}
                  </Link>
                </div>
              </div>
            ) : isTalentAccount ? (
              <div className="lg:sticky lg:top-28">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                  <p className="text-xs text-gold">
                    {isRtl ? "حساب موهبة" : "Talent account"}
                  </p>
                  <h2 className="mt-3 text-2xl font-light">
                    {isRtl
                      ? "التقديم يكون على الفرص"
                      : "Apply through opportunities"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-white/45">
                    {isRtl
                      ? "حسابات المواهب لا تطلب مواهب أخرى. يمكنك استعراض الفرص والتقديم عليها من صفحة الفرص."
                      : "Talent accounts cannot request other talents. Browse opportunities and apply from the opportunities page."}
                  </p>
                  <Link
                    href={`/${locale}/opportunities`}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-gold/35 px-5 text-sm text-gold transition duration-300 hover:bg-gold/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  >
                    {isRtl ? "استعراض الفرص" : "Browse opportunities"}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {relatedTalents.length > 0 ? (
  <section className="mx-auto mt-12 max-w-6xl sm:mt-16">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p
          className={`text-[10px] text-gold ${
            isRtl ? "tracking-normal" : "uppercase tracking-[0.32em]"
          }`}
        >
          {isRtl ? "قد يعجبك أيضًا" : "You May Also Like"}
        </p>

        <h2
          className="mt-3 text-3xl font-light text-white sm:text-4xl"
          style={{
            fontFamily: isRtl
              ? "var(--font-noto-arabic)"
              : "var(--font-cormorant)",
          }}
        >
          {isRtl ? "مواهب مشابهة" : "Related Talents"}
        </h2>
      </div>

      <Link
        href={talentPath(locale)}
        className="rounded-sm text-xs text-gold transition duration-300 hover:text-gold-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {isRtl ? "عرض جميع المواهب" : "View all talents"}
      </Link>
    </div>

    <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {relatedTalents.map((item) => (
        <div
          key={item.id}
          className="h-full min-w-0 w-full"
        >
          <PublicTalentCard
            talent={item}
            locale={locale}
          />
        </div>
      ))}
    </div>
  </section>
) : null}
        </div>
      </section>

      <Footer locale={locale} />

    </main>
  );
}

function StatusPill({
  children,
  tone,
  isRtl,
}: {
  children: React.ReactNode;
  tone: "success" | "gold" | "neutral";
  isRtl: boolean;
}) {
  const styles = {
    success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    gold: "border-gold/30 bg-gold/[0.08] text-gold",
    neutral: "border-white/10 bg-white/[0.04] text-white/55",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[10px] ${
        isRtl ? "tracking-normal" : "uppercase tracking-[0.16em]"
      } ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function MiniFact({
  label,
  value,
  isRtl,
}: {
  label: string;
  value?: React.ReactNode;
  isRtl: boolean;
}) {
  if (!hasDisplayValue(value)) {
    return null;
  }

  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-black/20 px-3.5 py-3 transition-colors duration-300 hover:border-gold/20 hover:bg-white/[0.03]">
      <p
        className={`truncate text-[9px] text-white/35 ${
          isRtl ? "tracking-normal" : "uppercase tracking-[0.2em]"
        }`}
      >
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-medium leading-5 text-white sm:text-[15px]">
        {value}
      </p>
    </div>
  );
}

function ContentCard({
  eyebrow,
  title,
  children,
  isRtl,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  isRtl: boolean;
}) {
  return (
    <section className="min-w-0 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-4 transition-colors duration-300 hover:border-white/[0.12] sm:p-6">
      <p
        className={`text-[10px] text-gold ${
          isRtl ? "tracking-normal" : "uppercase tracking-[0.28em]"
        }`}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-light text-white sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 border-t border-white/[0.07] pt-4 sm:mt-5 sm:pt-5">{children}</div>
    </section>
  );
}

function DetailsCard({
  eyebrow,
  title,
  items,
  isRtl,
}: {
  eyebrow: string;
  title: string;
  items: Array<{ label: string; value: React.ReactNode }>;
  isRtl: boolean;
}) {
  return (
    <ContentCard eyebrow={eyebrow} title={title} isRtl={isRtl}>
      <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <MiniFact
            key={`${item.label}-${String(item.value)}`}
            label={item.label}
            value={item.value}
            isRtl={isRtl}
          />
        ))}
      </div>
    </ContentCard>
  );
}

function TagGroup({ title, values }: { title: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs text-white/45">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => (
          <span
            key={item}
            className="rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-1.5 text-xs leading-5 text-gold sm:text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 text-center text-xs text-white/70 transition duration-300 hover:border-gold/35 hover:bg-gold/[0.06] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      {children}
    </a>
  );
}
