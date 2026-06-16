import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { PublicTalentGallery } from "@/components/public/PublicTalentGallery";
import { ProfileShareButton } from "@/components/public/ProfileShareButton";
import { TalentRequestForm } from "@/components/public/TalentRequestForm";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildTalentMetadata } from "@/lib/seo/talent-metadata";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublishedTalentBySlug,
  getPublishedTalents,
} from "@/lib/supabase/public-talents";
import { talentPath } from "@/lib/utils/routes";
import {
  buildWhatsappUrl,
  normalizeInstagramUrl,
} from "@/lib/utils/social-links";
import { getRelatedTalents } from "@/lib/utils/talent-selectors";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";
import {
  getTalentBio,
  getTalentCategory,
  getTalentCity,
  getTalentName,
} from "@/lib/utils/talent-formatters";

// دوال ترجمة القيم حسب اللغة
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
  light: { ar: "فاتح نسبياً", en: "Light" },
  medium: { ar: "متوسط", en: "Medium" },
  olive: { ar: "زيتوني", en: "Olive" },
  tan: { ar: "برونزي", en: "Tan" },
  brown: { ar: "بني", en: "Brown" },
  dark: { ar: "غامق", en: "Dark" },
};

const CLOTHING_SIZE_LABELS: Record<string, { ar: string; en: string }> = {
  XS: { ar: "صغير جداً", en: "XS" },
  S: { ar: "صغير", en: "S" },
  M: { ar: "متوسط", en: "M" },
  L: { ar: "كبير", en: "L" },
  XL: { ar: "كبير جداً", en: "XL" },
  XXL: { ar: "ضخم", en: "XXL" },
};

function formatOption(
  value: string | null | undefined,
  labels?: Record<string, { ar: string; en: string }>,
  isRtl?: boolean
) {
  if (!value) return "-";
  if (labels && isRtl !== undefined) {
    const item = labels[value];
    if (!item) return value;
    return isRtl ? item.ar : item.en;
  }
  return formatTag(value);
}

function formatBoolean(value: boolean | null | undefined, isRtl: boolean) {
  if (value === null || value === undefined) return "-";
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

function normalizeSocialUrl(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
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
  suffix: string
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value) + " " + suffix;
}


export default async function TalentProfilePage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;

  if (!isValidLocale(localeParam) || !slug?.trim()) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const talent = await getPublishedTalentBySlug(slug);

  if (!talent) {
    notFound();
  }

  const adminClient = createAdminClient();

  await adminClient.rpc("increment_talent_view", {
    p_talent_id: talent.id,
  });

  const allTalents = await getPublishedTalents();
  const relatedTalents = getRelatedTalents(allTalents, talent);


  const instagramUrl = normalizeInstagramUrl(talent.instagram);
  const whatsappUrl = buildWhatsappUrl(talent.whatsapp);
  const tiktokUrl = normalizeSocialUrl(talent.tiktok);
  const snapchatUrl = normalizeSocialUrl(talent.snapchat);
  const portfolioUrl = normalizeSocialUrl(talent.portfolio_url);

  const gallery = normalizeGalleryImages(talent.gallery_images);

  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);
  const bio = getTalentBio(talent, locale);

  const age = calculateAge(talent.date_of_birth);
  const gender = formatGender(talent.gender, isRtl);

  const availabilityMap: Record<string, string> = {
    available_now: isRtl ? "متاح حاليًا" : "Available Now",
    available_this_week: isRtl ? "متاح هذا الأسبوع" : "Available This Week",
    available_next_month: isRtl ? "متاح الشهر القادم" : "Available Next Month",
    unavailable: isRtl ? "غير متاح حاليًا" : "Unavailable",
  };

  const availability = talent.availability_status
    ? availabilityMap[talent.availability_status] || "—"
    : "—";

  return (
    <main
      className="min-h-screen bg-background text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Navbar locale={locale} />

      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,98,0.08),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-10">
            <Link
              href={talentPath(locale)}
              className="text-[10px] uppercase tracking-[0.35em] text-gold transition hover:text-gold-soft"
            >
              {isRtl ? "← العودة للمواهب" : "← Back to talents"}
            </Link>
          </div>

          <div className="grid gap-14 lg:grid-cols-[460px_minmax(0,1fr)]">
            <div>
              <PublicTalentGallery
                imageUrl={talent.image_url}
                galleryImages={gallery}
                alt={name || "Talent image"}
              />
            </div>

            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {talent.featured ? (
                  <div className="inline-flex items-center rounded-full border border-gold/30 bg-gold/[0.06] px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "موهبة مميزة" : "Featured Talent"}
                  </div>
                ) : null}

                {talent.verified ? (
                  <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-emerald-300">
                    ✓ {isRtl ? "موثق" : "Verified"}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <h1
                  className="text-[clamp(3rem,8vw,6.5rem)] leading-[0.92] font-light tracking-tight text-white"
                  style={{
                    fontFamily: isRtl
                      ? "var(--font-noto-arabic)"
                      : "var(--font-cormorant)",
                  }}
                >
                  {name || (isRtl ? "موهبة غير مسماة" : "Unnamed Talent")}
                </h1>

                {talent.verified ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-300">
                    ✓
                  </span>
                ) : null}
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <InfoBox
                  label={isRtl ? "التصنيف" : "Category"}
                  value={category}
                />

                <InfoBox label={isRtl ? "المدينة" : "City"} value={city} />

                <InfoBox label={isRtl ? "الجنس" : "Gender"} value={gender} />

                <InfoBox
                  label={isRtl ? "الجنسية" : "Nationality"}
                  value={talent.nationality}
                />

                <InfoBox label={isRtl ? "العمر" : "Age"} value={age} />

                <InfoBox
                  label={isRtl ? "الحالة" : "Availability"}
                  value={availability}
                />
              </div>

              {bio ? (
                <div className="mt-14 max-w-3xl">
                  <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
                    {isRtl ? "نبذة" : "Biography"}
                  </h2>

                  <p
                    className="whitespace-pre-line text-lg leading-relaxed text-white/75"
                    style={{
                      fontFamily: isRtl
                        ? "var(--font-noto-arabic)"
                        : undefined,
                    }}
                  >
                    {bio}
                  </p>
                </div>
              ) : null}

              <TagSection
                title={isRtl ? "اللغات" : "Languages"}
                values={talent.languages}
              />

              <TagSection
                title={isRtl ? "اللهجات" : "Dialects"}
                values={talent.dialects}
              />

              <TagSection
                title={isRtl ? "المهارات" : "Skills"}
                values={talent.skills}
              />


              <div className="mt-14">
                <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
                  {isRtl ? "المواصفات الجسدية" : "Physical Details"}
                </h2>

                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoBox
                    label={isRtl ? "الطول" : "Height"}
                    value={formatMeasurement(talent.height_cm, isRtl ? "سم" : "cm")}
                  />

                  <InfoBox
                    label={isRtl ? "الوزن" : "Weight"}
                    value={formatMeasurement(talent.weight_kg, isRtl ? "كجم" : "kg")}
                  />

                  <InfoBox
                    label={isRtl ? "لون العين" : "Eye Color"}
                    value={formatOption(talent.eye_color, EYE_COLOR_LABELS)}
                  />

                  <InfoBox
                    label={isRtl ? "لون الشعر" : "Hair Color"}
                    value={formatOption(talent.hair_color, HAIR_COLOR_LABELS)}
                  />

                  <InfoBox
                    label={isRtl ? "نوع الشعر" : "Hair Type"}
                    value={formatOption(talent.hair_type, HAIR_TYPE_LABELS)}
                  />

                  <InfoBox
                    label={isRtl ? "لون البشرة" : "Skin Color"}
                    value={formatOption(talent.skin_color, SKIN_COLOR_LABELS)}
                  />

                  <InfoBox
                    label={isRtl ? "مقاس الملابس" : "Clothing Size"}
                    value={formatOption(talent.clothing_size, CLOTHING_SIZE_LABELS)}
                  />

                  <InfoBox
                    label={isRtl ? "مقاس الحذاء" : "Shoe Size"}
                    value={talent.shoe_size}
                  />

                  <InfoBox
                    label={isRtl ? "مقاس الصدر" : "Chest Size"}
                    value={talent.chest_size}
                  />

                  <InfoBox
                    label={isRtl ? "مقاس الخصر" : "Waist Size"}
                    value={talent.waist_size}
                  />

                  <InfoBox
                    label={isRtl ? "مقاس الورك" : "Hip Size"}
                    value={talent.hip_size}
                  />
                </div>
              </div>

              <div className="mt-14">
                <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
                  {isRtl ? "الخبرة والتنقل" : "Experience & Mobility"}
                </h2>

                <div className="grid gap-5 sm:grid-cols-2">
                  <InfoBox
                    label={isRtl ? "سنوات الخبرة" : "Experience Years"}
                    value={talent.experience_years}
                  />

                  <InfoBox
                    label={isRtl ? "مستعد للسفر" : "Ready to Travel"}
                    value={formatBoolean(talent.ready_to_travel, isRtl)}
                  />

                  <InfoBox
                    label={isRtl ? "يمتلك جواز سفر" : "Has Passport"}
                    value={formatBoolean(talent.has_passport, isRtl)}
                  />

                  <InfoBox
                    label={isRtl ? "يمتلك سيارة" : "Has Car"}
                    value={formatBoolean(talent.has_car, isRtl)}
                  />

                  <InfoBox
                    label={isRtl ? "يقبل العمل خارج المدينة" : "Work Outside City"}
                    value={formatBoolean(talent.work_outside_city, isRtl)}
                  />

                  <InfoBox
                    label={isRtl ? "يقبل العمل خارج الدولة" : "Work Outside Country"}
                    value={formatBoolean(talent.work_outside_country, isRtl)}
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-4">
                  {talent.video_intro ? (
                    <SocialButton href={normalizeSocialUrl(talent.video_intro) || talent.video_intro}>
                      {isRtl ? "فيديو تعريفي" : "Video Intro"}
                    </SocialButton>
                  ) : null}

                  {talent.showreel_url ? (
                    <SocialButton href={normalizeSocialUrl(talent.showreel_url) || talent.showreel_url}>
                      {isRtl ? "شو ريل" : "Showreel"}
                    </SocialButton>
                  ) : null}
                </div>
              </div>

              <div className="mt-14 flex flex-wrap gap-4">
                <ProfileShareButton
                  locale={locale}
                  title={name || "MLAMH Talent"}
                />

                {instagramUrl ? (
                  <SocialButton href={instagramUrl}>Instagram</SocialButton>
                ) : null}

                {tiktokUrl ? (
                  <SocialButton href={tiktokUrl}>TikTok</SocialButton>
                ) : null}

                {snapchatUrl ? (
                  <SocialButton href={snapchatUrl}>Snapchat</SocialButton>
                ) : null}

                {portfolioUrl ? (
                  <SocialButton href={portfolioUrl}>Portfolio</SocialButton>
                ) : null}

                {whatsappUrl ? (
                  <SocialButton href={whatsappUrl}>WhatsApp</SocialButton>
                ) : null}
              </div>

              <TalentRequestForm talentId={talent.id} locale={locale} />
            </div>
          </div>

          {relatedTalents.length > 0 ? (
            <section className="mt-32">
              <div className="mb-10">
                <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
                  {isRtl ? "قد يعجبك أيضًا" : "You May Also Like"}
                </p>

                <h2
                  className="text-4xl font-light text-white md:text-5xl"
                  style={{
                    fontFamily: isRtl
                      ? "var(--font-noto-arabic)"
                      : "var(--font-cormorant)",
                  }}
                >
                  {isRtl ? "مواهب مشابهة" : "Related Talents"}
                </h2>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {relatedTalents.map((item) => (
                  <PublicTalentCard
                    key={item.id}
                    talent={item}
                    locale={locale}
                  />
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

function InfoBox({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-6 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-xl font-light text-white">{value || "—"}</p>
    </div>
  );
}

function TagSection({
  title,
  values,
}: {
  title: string;
  values?: string[] | string | null;
}) {
  const normalizedValues = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? [values]
      : [];

  if (normalizedValues.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
        {title}
      </h2>

      <div className="flex flex-wrap gap-3">
        {normalizedValues.map((item) => (
          <span
            key={item}
            className="rounded-full border border-gold/20 bg-gold/[0.05] px-4 py-2 text-sm text-gold"
          >
            {formatTag(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialButton({
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
      className="rounded-full border border-gold/30 bg-gold/[0.05] px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/10"
    >
      {children}
    </a>
  );
}
