import Link from "next/link";
import type { Metadata } from "next";

import OpportunityShareButton from "@/components/opportunities/OpportunityShareButton";
import OpportunityViewTracker from "@/components/opportunities/OpportunityViewTracker";
import { applyToOpportunityAction } from "@/lib/actions/apply-to-opportunity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import { revalidatePath } from "next/cache";

type OpportunityPageProps = {
  params: Promise<{ locale?: string; slug: string }>;
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net"
).replace(/\/$/, "");

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected";

  function createMetaDescription(
    value: string | null | undefined,
    fallback: string,
  ) {
    const description = value
      ?.replace(/\s+/g, " ")
      .trim();
  
    if (!description) {
      return fallback;
    }
  
    return description.length > 160
      ? `${description.slice(0, 157).trimEnd()}...`
      : description;
  }

function OpportunityIcon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "arrow"
    | "briefcase"
    | "calendar"
    | "city"
    | "gender"
    | "age"
    | "wallet"
    | "check"
    | "clock"
    | "company";
  className?: string;
}) {
  if (name === "briefcase") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <rect x="4" y="7" width="16" height="12" rx="2.5" />
        <path d="M9 7V5h6v2M4 11h16" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
        <path d="M8 4v3M16 4v3M4 9.5h16" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "city") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }

  if (name === "gender") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="10" cy="10" r="4" />
        <path d="M13 7l5-5M14.5 2H18v3.5M10 14v7M7.5 18.5h5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "age") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9 10.5h.01M15 10.5h.01M9 15c1.8 1.2 4.2 1.2 6 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <rect x="4" y="6" width="16" height="13" rx="2.5" />
        <path d="M15 10h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.2 12 2.5 2.5 5.3-5.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "company") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <path d="M5 20V7h9v13M14 11h5v9M8 10h3M8 13h3M8 16h3M16 14h1M16 17h1" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatCompensation(
  compensationType: string | null | undefined,
  value: unknown,
  isRtl: boolean,
) {
  if (compensationType === "negotiable") {
    return isRtl ? "حسب الاتفاق" : "Negotiable";
  }

  if (compensationType === "unpaid") {
    return isRtl ? "غير مدفوع" : "Unpaid";
  }

  const budget = Number(value);

  if (!Number.isFinite(budget) || budget <= 0) {
    return isRtl ? "غير محدد" : "Not specified";
  }

  return `${new Intl.NumberFormat("en-US").format(budget)} ${
    isRtl ? "ريال" : "SAR"
  }`;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-nu-latn" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}

function formatWorkDuration(
  value: string | null | undefined,
  isRtl: boolean,
) {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  const labels: Record<string, { ar: string; en: string }> = {
    // القيم الجديدة
    "1_hour": { ar: "ساعة", en: "1 Hour" },
    "2_hours": { ar: "ساعتان", en: "2 Hours" },
    "4_hours": { ar: "4 ساعات", en: "4 Hours" },
    "full_day": { ar: "يوم كامل", en: "Full Day" },

    // دعم البيانات القديمة الموجودة مسبقًا
    "1 hour": { ar: "ساعة", en: "1 Hour" },
    "2 hours": { ar: "ساعتان", en: "2 Hours" },
    "4 hours": { ar: "4 ساعات", en: "4 Hours" },
    "full day": { ar: "يوم كامل", en: "Full Day" },
  };

  const match = labels[normalized];

  if (match) {
    return isRtl ? match.ar : match.en;
  }

  return value;
}

function getOpportunityTypeLabel(value: unknown, isRtl: boolean) {
  const type = String(value ?? "");

  const labels: Record<string, { ar: string; en: string }> = {
    actor: {
      ar: "ممثل / ممثلة",
      en: "Actor",
    },
    model: {
      ar: "مودل",
      en: "Model",
    },
  };

  if (labels[type]) {
    return isRtl ? labels[type].ar : labels[type].en;
  }

  return type ? type.replaceAll("_", " ") : isRtl ? "فرصة" : "Opportunity";
}

function getGenderLabel(value: unknown, isRtl: boolean) {
  const gender = String(value ?? "").toLowerCase();

  if (!gender) return isRtl ? "غير محدد" : "Not specified";
  if (gender === "male") return isRtl ? "ذكر" : "Male";
  if (gender === "female") return isRtl ? "أنثى" : "Female";
  if (gender === "any" || gender === "all") {
    return isRtl ? "الجميع" : "Any";
  }

  return gender.replaceAll("_", " ");
}
function getRoleRequirementLabel(
  value: unknown,
  isRtl: boolean,
) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");

  const labels: Record<
    string,
    { ar: string; en: string }
  > = {
    arabic: { ar: "العربية", en: "Arabic" },
    english: { ar: "الإنجليزية", en: "English" },
    french: { ar: "الفرنسية", en: "French" },

    najdi: { ar: "نجدي", en: "Najdi" },
    hejazi: { ar: "حجازي", en: "Hejazi" },
    southern: { ar: "جنوبي", en: "Southern" },
    northern: { ar: "شمالي", en: "Northern" },
    gulf: { ar: "خليجي", en: "Gulf" },

    commercial: { ar: "تجاري", en: "Commercial" },
    fashion: { ar: "أزياء", en: "Fashion" },
    beauty: { ar: "جمال", en: "Beauty" },
    lifestyle: { ar: "لايف ستايل", en: "Lifestyle" },
    ecommerce: { ar: "متاجر إلكترونية", en: "E-commerce" },

    black: { ar: "أسود", en: "Black" },
    brown: { ar: "بني", en: "Brown" },
    blonde: { ar: "أشقر", en: "Blonde" },
    red: { ar: "أحمر", en: "Red" },
    gray: { ar: "رمادي", en: "Gray" },
    other: { ar: "أخرى", en: "Other" },
  };

  const translated = labels[key];

  if (translated) {
    return isRtl
      ? translated.ar
      : translated.en;
  }

  return key.replaceAll("_", " ");
}
function getAgeDisplay(
  minAge: number | null | undefined,
  maxAge: number | null | undefined,
  isRtl: boolean,
) {
  if (minAge == null && maxAge == null) {
    return {
      title: isRtl ? "جميع الأعمار" : "All Ages",
      detail: isRtl
        ? "لا يوجد عمر محدد"
        : "No age restriction",
    };
  }

  if (minAge === 18 && maxAge == null) {
    return {
      title: isRtl ? "للبالغين فقط" : "Adults Only",
      detail: isRtl
        ? "18 سنة فأكثر"
        : "18 years and above",
    };
  }

  if (minAge != null && maxAge != null) {
    return {
      title:
        maxAge <= 12
          ? isRtl
            ? "الأطفال"
            : "Children"
          : maxAge <= 17
            ? isRtl
              ? "الناشئون"
              : "Teenagers"
            : isRtl
              ? "نطاق عمر محدد"
              : "Specific Age Range",

      detail: isRtl
        ? `من ${minAge} إلى ${maxAge} سنة`
        : `${minAge} to ${maxAge} years`,
    };
  }

  if (minAge != null) {
    return {
      title: isRtl
        ? "الحد الأدنى للعمر"
        : "Minimum Age",

      detail: isRtl
        ? `${minAge} سنة فأكثر`
        : `${minAge} years and above`,
    };
  }

  if (maxAge != null) {
    return {
      title: isRtl
        ? "الحد الأعلى للعمر"
        : "Maximum Age",

      detail: isRtl
        ? `حتى ${maxAge} سنة`
        : `Up to ${maxAge} years`,
    };
  }

  return {
    title: isRtl ? "جميع الأعمار" : "All Ages",
    detail: isRtl
      ? "لا يوجد عمر محدد"
      : "No age restriction",
  };
}

function getDeadlineDisplay(
  value: string | null | undefined,
  isRtl: boolean,
) {
  if (!value) {
    return {
      isExpired: false,
      isUrgent: false,
      label: isRtl ? "التقديم مفتوح" : "Applications Open",
      detail: isRtl ? "لا يوجد موعد معلن" : "No deadline announced",
    };
  }

  const deadlineDate = new Date(`${value}T23:59:59`);
  const now = new Date();

  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      isExpired: false,
      isUrgent: false,
      label: isRtl ? "التقديم مفتوح" : "Applications Open",
      detail: isRtl ? "الموعد غير محدد" : "Deadline unavailable",
    };
  }

  const remainingMilliseconds =
    deadlineDate.getTime() - now.getTime();

  const remainingDays = Math.ceil(
    remainingMilliseconds / (1000 * 60 * 60 * 24),
  );

  if (remainingDays < 0) {
    return {
      isExpired: true,
      isUrgent: false,
      label: isRtl ? "انتهى التقديم" : "Applications Closed",
      detail: isRtl
        ? "انتهت مدة استقبال الطلبات"
        : "The application period has ended",
    };
  }

  if (remainingDays === 0) {
    return {
      isExpired: false,
      isUrgent: true,
      label: isRtl ? "آخر يوم للتقديم" : "Last Day to Apply",
      detail: isRtl ? "ينتهي اليوم" : "Closes today",
    };
  }

  return {
    isExpired: false,
    isUrgent: remainingDays <= 3,
    label: isRtl ? "متاح للتقديم" : "Open for Applications",
    detail: isRtl
      ? `متبقي ${remainingDays} ${
          remainingDays === 1 ? "يوم" : "أيام"
        }`
      : `${remainingDays} day${
          remainingDays === 1 ? "" : "s"
        } remaining`,
  };
}

function getApplicationProgress(
  startValue: string | null | undefined,
  deadlineValue: string | null | undefined,
) {
  if (!startValue || !deadlineValue) {
    return null;
  }

  const startDate = new Date(`${startValue.slice(0, 10)}T00:00:00`);
  const deadlineDate = new Date(
    `${deadlineValue.slice(0, 10)}T23:59:59`,
  );
  const now = new Date();

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(deadlineDate.getTime()) ||
    deadlineDate.getTime() <= startDate.getTime()
  ) {
    return null;
  }

  const totalDuration =
    deadlineDate.getTime() - startDate.getTime();

  const elapsedDuration =
    now.getTime() - startDate.getTime();

  const rawPercentage =
    (elapsedDuration / totalDuration) * 100;

  const percentage = Math.min(
    100,
    Math.max(0, Math.round(rawPercentage)),
  );

  return {
    percentage,
    hasStarted: now.getTime() >= startDate.getTime(),
    hasEnded: now.getTime() > deadlineDate.getTime(),
  };
}

function getApplicationStatusLabel(
  status: ApplicationStatus | string | null | undefined,
  isRtl: boolean
) {
  if (status === "reviewing") return isRtl ? "قيد المراجعة" : "Under Review";
  if (status === "shortlisted") {
    return isRtl ? "القائمة المختصرة" : "Shortlisted";
  }
  if (status === "accepted") return isRtl ? "مقبول" : "Accepted";
  if (status === "rejected") return isRtl ? "مرفوض" : "Rejected";
  return isRtl ? "تم التقديم" : "Applied";
}

export async function generateMetadata({
  params,
}: OpportunityPageProps): Promise<Metadata> {
  const {
    locale = "ar",
    slug: rawSlug,
  } = await params;

  const slug = decodeURIComponent(rawSlug);
  const isRtl = locale === "ar";

  const opportunities =
    await getPublishedOpportunities();

  const opportunity =
    opportunities.find(
      (item) =>
        item.slug === slug ||
        String(item.id) === slug,
    ) ?? null;

  if (!opportunity) {
    return {
      title: isRtl
        ? "الفرصة غير موجودة | ملامح"
        : "Opportunity Not Found | MLAMH",

      description: isRtl
        ? "تعذر العثور على هذه الفرصة في منصة ملامح."
        : "This opportunity could not be found on MLAMH.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    opportunity.title ||
    (isRtl
      ? "فرصة جديدة"
      : "New Opportunity");

  const city = isRtl
    ? opportunity.city_ar ||
      opportunity.city_en
    : opportunity.city_en ||
      opportunity.city_ar;

  const opportunityType =
    getOpportunityTypeLabel(
      opportunity.opportunity_type,
      isRtl,
    );

  const fallbackDescription = isRtl
    ? `اكتشف فرصة ${opportunityType}${
        city ? ` في ${city}` : ""
      } وقدّم عليها عبر منصة ملامح.`
    : `Discover this ${opportunityType} opportunity${
        city ? ` in ${city}` : ""
      } and apply through MLAMH.`;

  const description = createMetaDescription(
    opportunity.description,
    fallbackDescription,
  );

  const canonicalSlug =
  opportunity.slug || String(opportunity.id);

const canonicalUrl =
  `${SITE_URL}/${locale}/opportunities/${encodeURIComponent(
    canonicalSlug,
  )}`;

const arUrl =
  `${SITE_URL}/ar/opportunities/${encodeURIComponent(
    canonicalSlug,
  )}`;

const enUrl =
  `${SITE_URL}/en/opportunities/${encodeURIComponent(
    canonicalSlug,
  )}`;

const ogImage = `${SITE_URL}/og-image.png`;

return {
  title: `${title} | ${isRtl ? "ملامح" : "MLAMH"}`,
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
    type: "website",
    locale: isRtl ? "ar_SA" : "en_US",
    title,
    description,
    url: canonicalUrl,
    siteName: isRtl ? "ملامح" : "MLAMH",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityPageProps) {
  const { locale = "ar", slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const isRtl = locale === "ar";

  const opportunities = await getPublishedOpportunities();

  type PublishedOpportunity = (typeof opportunities)[number];

const opportunity = (
  opportunities.find(
    (item: PublishedOpportunity) =>
      item.slug === slug || String(item.id) === slug,
  ) || null
) as
| ((typeof opportunities)[number] & {
  publisher_name?: string | null;
  company?: string | null;
  deadline?: string | null;
  application_start_date?: string | null;
  application_deadline?: string | null;

  required_count?: number | null;
  work_date?: string | null;
  work_duration?: string | null;
  compensation_type?: string | null;
  role_requirements?: Record<string, unknown> | null;
})
    | null;

  if (!opportunity) {
    return (
      <main
  dir={isRtl ? "rtl" : "ltr"}
  className="
    min-h-screen
    bg-background
    px-4
    pb-[12rem]
    pt-24
    text-white
    sm:px-6
    sm:pt-28
    lg:pb-24
    lg:pt-32
  "
>
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 text-center sm:p-10">
          <p className="text-[9px] uppercase tracking-[0.35em] text-gold">
            {isRtl ? "فرص ملامح" : "MLAMH Opportunities"}
          </p>

          <h1 className="mt-4 text-3xl font-light sm:text-4xl">
            {isRtl ? "لم يتم العثور على الفرصة" : "Opportunity Not Found"}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/45">
            {isRtl
              ? "الفرصة التي تحاول الوصول إليها غير موجودة أو لم تعد متاحة."
              : "The opportunity you are looking for does not exist or is no longer available."}
          </p>

          <Link
            href={`/${locale}/opportunities`}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3 text-sm text-black transition hover:bg-gold-soft"
          >
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
            <span className={isRtl ? "rotate-180" : ""}>
              <OpportunityIcon name="arrow" className="h-4 w-4" />
            </span>
          </Link>
        </section>
      </main>
    );
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: savedOpportunity, error: savedOpportunityError } =
  user
    ? await authClient
        .from("saved_opportunities")
        .select("id")
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunity.id)
        .maybeSingle()
    : { data: null, error: null };

if (savedOpportunityError) {
  throw new Error(
    `[OpportunityDetailPage saved opportunity] ${savedOpportunityError.message}`,
  );
}

const isSaved = Boolean(savedOpportunity);

  const { data: profile, error: profileError } = user
    ? await adminClient
        .from("profiles")
        .select("account_type, approval_status")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null, error: null };

  if (profileError) {
    throw new Error(
      `[OpportunityDetailPage profile] ${profileError.message}`
    );
  }

  const { data: talent, error: talentError } =
    user && profile?.account_type === "talent"
      ? await adminClient
      .from("talents")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle()
      : { data: null, error: null };

  if (talentError) {
    throw new Error(
      `[OpportunityDetailPage talent] ${talentError.message}`
    );
  }


  const { data: existingApplication, error: existingApplicationError } = talent
    ? await adminClient
        .from("opportunity_applications")
        .select("id, status")
        .eq("opportunity_id", opportunity.id)
        .eq("talent_id", talent.id)
        .maybeSingle()
    : { data: null, error: null };

  if (existingApplicationError) {
    throw new Error(
      `[OpportunityDetailPage application] ${existingApplicationError.message}`
    );
  }

  const isOpen =
    opportunity.status === "open" || opportunity.status === "published";

    const approvalStatus =
  profile?.approval_status ??
  "not_submitted";

const isTalentApproved =
  approvalStatus === "approved";

  const canViewApplicationArea =
    !user || profile?.account_type === "talent";

    const canApply = Boolean(
      user &&
        profile?.account_type === "talent" &&
        talent &&
        isTalentApproved &&
        !existingApplication &&
        isOpen
    );

  const city = isRtl
    ? opportunity.city_ar || opportunity.city_en || "—"
    : opportunity.city_en || opportunity.city_ar || "—";

    const budget = formatCompensation(
      opportunity.compensation_type,
      opportunity.budget,
      isRtl,
    );
  const opportunityType = getOpportunityTypeLabel(
    opportunity.opportunity_type,
    isRtl
  );
  const gender = getGenderLabel(opportunity.required_gender, isRtl);
  const companyName =
    opportunity.company_name ||
    opportunity.publisher_name ||
    opportunity.company ||
    (isRtl ? "جهة غير محددة" : "Publisher not specified");
  const publishedDate = formatDate(opportunity.created_at, locale);
  const applicationStartValue =
  opportunity.application_start_date || null;

const deadlineValue =
  opportunity.application_deadline ||
  opportunity.deadline ||
  null;

const applicationStartDate = applicationStartValue
  ? formatDate(applicationStartValue, locale)
  : null;

const deadline = deadlineValue
  ? formatDate(deadlineValue, locale)
  : null;

  const ageDisplay = getAgeDisplay(
    opportunity.min_age,
    opportunity.max_age,
    isRtl,
  );
  
  const workDate = opportunity.work_date
  ? formatDate(opportunity.work_date, locale)
  : null;

  const workDuration = formatWorkDuration(
    opportunity.work_duration,
    isRtl,
  );

const requiredCount =
  opportunity.required_count ?? null;

const roleRequirements =
  opportunity.role_requirements &&
  typeof opportunity.role_requirements === "object" &&
  !Array.isArray(opportunity.role_requirements)
    ? opportunity.role_requirements
    : {};

const opportunityTypeKey = String(
  opportunity.opportunity_type ?? "",
)
  .trim()
  .toLowerCase()
  .replaceAll("-", "_");
  
  const roleRequirementItems: Array<{
    label: string;
    value: string;
  }> = [];
  
  if (opportunityTypeKey === "actor") {
    const languages = Array.isArray(
      roleRequirements.languages,
    )
      ? roleRequirements.languages.map((item) =>
          getRoleRequirementLabel(item, isRtl),
        )
      : [];
  
    const dialects = Array.isArray(
      roleRequirements.dialects,
    )
      ? roleRequirements.dialects.map((item) =>
          getRoleRequirementLabel(item, isRtl),
        )
      : [];
  
    if (languages.length > 0) {
      roleRequirementItems.push({
        label: isRtl
          ? "اللغات المطلوبة"
          : "Required Languages",
        value: languages.join("، "),
      });
    }
  
    if (dialects.length > 0) {
      roleRequirementItems.push({
        label: isRtl
          ? "اللهجات المطلوبة"
          : "Required Dialects",
        value: dialects.join("، "),
      });
    }
  }
  
  if (opportunityTypeKey === "model") {
    const modelingTypes = Array.isArray(
      roleRequirements.modeling_types,
    )
      ? roleRequirements.modeling_types.map(
          (item) =>
            getRoleRequirementLabel(item, isRtl),
        )
      : [];
  
    if (modelingTypes.length > 0) {
      roleRequirementItems.push({
        label: isRtl
          ? "نوع أعمال المودل"
          : "Modeling Types",
        value: modelingTypes.join("، "),
      });
    }
  
    if (
      roleRequirements.min_height_cm !== null &&
      roleRequirements.min_height_cm !== undefined
    ) {
      roleRequirementItems.push({
        label: isRtl
          ? "الحد الأدنى للطول"
          : "Minimum Height",
        value: isRtl
          ? `${roleRequirements.min_height_cm} سم`
          : `${roleRequirements.min_height_cm} cm`,
      });
    }
  
    if (roleRequirements.hair_color) {
      roleRequirementItems.push({
        label: isRtl
          ? "لون الشعر"
          : "Hair Color",
        value: getRoleRequirementLabel(
          roleRequirements.hair_color,
          isRtl,
        ),
      });
    }
  }
  
  const deadlineDisplay = getDeadlineDisplay(
    deadlineValue,
    isRtl,
  );
  
  const publicIsOpen =
    isOpen && !deadlineDisplay.isExpired;
    const shouldPinMobileApplicationArea =
  publicIsOpen &&
  (!user ||
    canApply ||
    Boolean(existingApplication));
    const applicationProgress =
  getApplicationProgress(
    applicationStartValue,
    deadlineValue,
  );
    const opportunityDescription =
  opportunity.description?.trim() ||
  (isRtl
    ? "لا يوجد وصف متاح لهذه الفرصة."
    : "No description is available for this opportunity.");

const opportunitySummary =
  opportunityDescription.length > 220
    ? `${opportunityDescription.slice(0, 220).trimEnd()}...`
    : opportunityDescription;

const normalizeOpportunityText = (value: string) =>
  value
    .toLocaleLowerCase(locale === "ar" ? "ar-SA" : "en-US")
    .replace(/[\\s\\p{P}\\p{S}]+/gu, " ")
    .trim();

const normalizedTitle = normalizeOpportunityText(
  opportunity.title || "",
);
const normalizedDescription = normalizeOpportunityText(
  opportunityDescription,
);

const hasMeaningfulDescription =
  normalizedDescription.length > 0 &&
  normalizedDescription !==
    normalizeOpportunityText(
      isRtl
        ? "لا يوجد وصف متاح لهذه الفرصة."
        : "No description is available for this opportunity.",
    ) &&
  normalizedDescription !== normalizedTitle &&
  !(
    normalizedTitle &&
    normalizedDescription.length < 90 &&
    (normalizedDescription.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedDescription))
  );

    const opportunityHighlights = [
      publicIsOpen
        ? {
            title: isRtl
              ? "التقديم متاح الآن"
              : "Applications are open",
            description: deadlineDisplay.detail,
            icon: "clock" as const,
            tone: deadlineDisplay.isUrgent
              ? ("warning" as const)
              : ("success" as const),
          }
        : {
            title: isRtl
              ? "انتهى استقبال الطلبات"
              : "Applications are closed",
            description: deadlineDisplay.detail,
            icon: "clock" as const,
            tone: "danger" as const,
          },
    
      opportunity.compensation_type === "unpaid"
        ? {
            title: isRtl
              ? "فرصة غير مدفوعة"
              : "Unpaid Opportunity",
            description: isRtl
              ? "لا يوجد مقابل مالي لهذه الفرصة."
              : "No financial compensation is offered for this opportunity.",
            icon: "wallet" as const,
            tone: "default" as const,
          }
        : opportunity.compensation_type === "negotiable"
          ? {
              title: isRtl
                ? "المقابل حسب الاتفاق"
                : "Compensation Negotiable",
              description: isRtl
                ? "يتم الاتفاق على المقابل المالي مع الجهة الناشرة."
                : "Compensation will be agreed with the publisher.",
              icon: "wallet" as const,
              tone: "default" as const,
            }
          : {
              title: isRtl
                ? "المقابل المالي معلن"
                : "Compensation Disclosed",
              description: budget,
              icon: "wallet" as const,
              tone: "default" as const,
            },
    
      {
        title: ageDisplay.title,
        description: ageDisplay.detail,
        icon: "age" as const,
        tone: "default" as const,
      },
    
      {
        title: isRtl
          ? "الموقع محدد"
          : "Location specified",
        description: city,
        icon: "city" as const,
        tone: "default" as const,
      },
    
      {
        title: isRtl
          ? "متابعة الطلب عبر ملامح"
          : "Track through MLAMH",
        description: isRtl
          ? "يمكنك متابعة آخر حالة من صفحة طلباتي."
          : "Track the latest status from My Applications.",
        icon: "check" as const,
        tone: "success" as const,
      },
    ];
    const relatedOpportunities = opportunities
    .filter((item: PublishedOpportunity) => {
      if (item.id === opportunity.id) {
        return false;
      }
  
      const sameType =
        item.opportunity_type ===
        opportunity.opportunity_type;
  
      const sameCity =
        item.city_ar === opportunity.city_ar ||
        item.city_en === opportunity.city_en;
  
      return sameType || sameCity;
    })
    .sort((first, second) => {
      const firstSameType =
        first.opportunity_type ===
        opportunity.opportunity_type;
  
      const secondSameType =
        second.opportunity_type ===
        opportunity.opportunity_type;
  
      if (firstSameType && !secondSameType) {
        return -1;
      }
  
      if (!firstSameType && secondSameType) {
        return 1;
      }
  
      return (
        new Date(second.created_at).getTime() -
        new Date(first.created_at).getTime()
      );
    })
    .slice(0, 3);
    const shouldRenderJobPosting =
  opportunity.compensation_type !== "unpaid";
  const opportunityCanonicalSlug =
  opportunity.slug || String(opportunity.id);

const opportunityCanonicalUrl =
  `${SITE_URL}/${locale}/opportunities/${encodeURIComponent(
    opportunityCanonicalSlug,
  )}`;

const opportunityStructuredData = {
  "@context": "https://schema.org",
  "@type": "JobPosting",

  "@id": `${opportunityCanonicalUrl}#jobposting`,

  url: opportunityCanonicalUrl,

  title:
    opportunity.title ||
    (isRtl
      ? "فرصة عبر ملامح"
      : "MLAMH Opportunity"),

  description: opportunityDescription,

  datePosted:
    opportunity.created_at || undefined,

  validThrough:
    deadlineValue
      ? `${deadlineValue.slice(0, 10)}T23:59:59+03:00`
      : undefined,

  employmentType: "CONTRACTOR",

  hiringOrganization:
  companyName !== "جهة غير محددة" &&
  companyName !== "Publisher not specified"
    ? {
        "@type": "Organization",
        name: companyName,
      }
    : undefined,

  jobLocation: city && city !== "—"
    ? {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: "SA",
        },
      }
    : undefined,
};
    async function toggleSavedOpportunityAction() {
      "use server";
    
      const opportunityId = opportunity!.id;
      const opportunitySlug =
        opportunity!.slug || String(opportunity!.id);
    
      const supabase = await createServerSupabaseClient();
    
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
    
      if (!currentUser) {
        return;
      }
    
      const { data: existingSaved, error: existingSavedError } =
        await supabase
          .from("saved_opportunities")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("opportunity_id", opportunityId)
          .maybeSingle();
    
      if (existingSavedError) {
        throw new Error(
          `[toggleSavedOpportunityAction select] ${existingSavedError.message}`,
        );
      }
    
      if (existingSaved) {
        const { error } = await supabase
          .from("saved_opportunities")
          .delete()
          .eq("id", existingSaved.id);
    
        if (error) {
          throw new Error(
            `[toggleSavedOpportunityAction delete] ${error.message}`,
          );
        }
      } else {
        const { error } = await supabase
          .from("saved_opportunities")
          .insert({
            user_id: currentUser.id,
            opportunity_id: opportunityId,
          });
    
        if (error) {
          throw new Error(
            `[toggleSavedOpportunityAction insert] ${error.message}`,
          );
        }
      }
    
      revalidatePath(
        `/${locale}/opportunities/${encodeURIComponent(
          opportunitySlug,
        )}`,
      );
    }
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="
  min-h-screen
  overflow-x-clip
  bg-background
  px-3
  pb-[12rem]
  pt-6
  text-white
  sm:px-6
  sm:pt-12
  lg:pb-24
  lg:pt-32
"
      >
        <OpportunityViewTracker
  opportunityId={Number(opportunity.id)}
/>
        {shouldRenderJobPosting ? (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(
        opportunityStructuredData,
      ).replace(/</g, "\\u003c"),
    }}
  />
) : null}
    
        <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
          <Link
            href={`/${locale}/opportunities`}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-3 text-[10px] text-white/55 transition duration-300 hover:border-gold/35 hover:bg-white/[0.025] hover:text-gold sm:min-h-11 sm:px-4 sm:text-xs"
          >
            <span className={isRtl ? "rotate-180" : ""}>
              <OpportunityIcon name="arrow" className="h-4 w-4" />
            </span>
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
            </Link>

</div>

        <header className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080808] sm:rounded-[2.25rem]">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(201,169,98,0.19),transparent_32%),radial-gradient(circle_at_10%_90%,rgba(16,185,129,0.08),transparent_30%)]" />

  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),transparent_45%,rgba(201,169,98,0.035))]" />

  <div className="relative p-4 sm:p-7 lg:p-10">
  <div className="flex min-w-0 flex-col gap-4 sm:gap-7 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-gold/35 bg-gold/[0.08] px-3 py-1.5 text-[9px] text-gold sm:px-4 sm:py-2 sm:text-[10px]">
            {opportunityType}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] sm:gap-2 sm:px-4 sm:py-2 sm:text-[10px] ${
              deadlineDisplay.isExpired
                ? "border-red-300/25 bg-red-300/[0.07] text-red-200"
                : deadlineDisplay.isUrgent
                  ? "border-amber-300/25 bg-amber-300/[0.07] text-amber-200"
                  : "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                deadlineDisplay.isExpired
                  ? "bg-red-300"
                  : deadlineDisplay.isUrgent
                    ? "bg-amber-300"
                    : "bg-emerald-300"
              }`}
            />

            {deadlineDisplay.label}
          </span>

          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[9px] text-white/50 sm:px-4 sm:py-2 sm:text-[10px]">
  {isRtl ? "جهة ناشرة" : "Opportunity Publisher"}
</span>
        </div>

        <h1 className="mt-4 max-w-4xl break-words [overflow-wrap:anywhere] text-[1.65rem] font-light leading-[1.25] text-white sm:mt-7 sm:text-5xl sm:leading-[1.15] lg:text-7xl">
          {opportunity.title ||
            (isRtl
              ? "فرصة بدون عنوان"
              : "Untitled Opportunity")}
        </h1>

        <div className="mt-3 grid gap-1.5 text-[11px] text-white/50 sm:mt-6 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 sm:text-sm">
        <span className="inline-flex min-w-0 items-center gap-2">
  <OpportunityIcon
    name="company"
    className="h-4 w-4 shrink-0 text-gold"
  />

  <span className="min-w-0 break-words">
    {companyName}
  </span>
</span>

          <span className="inline-flex items-center gap-2">
            <OpportunityIcon
              name="city"
              className="h-4 w-4 text-gold"
            />
            {city}
          </span>

          <span className="inline-flex items-center gap-2">
            <OpportunityIcon
              name="calendar"
              className="h-4 w-4 text-gold"
            />
            {workDate || publishedDate}
          </span>
        </div>

        {hasMeaningfulDescription ? (
          <div className="mt-4 max-w-3xl sm:mt-7">
            <p className="break-words [overflow-wrap:anywhere] text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
              {opportunitySummary}
            </p>

            {opportunityDescription.length > 220 ? (
              <a
                href="#opportunity-description"
                className="mt-4 inline-flex items-center gap-2 text-xs text-gold transition hover:text-gold-soft"
              >
                {isRtl ? "قراءة الوصف الكامل" : "Read Full Description"}
                <span className="rotate-90">
                  <OpportunityIcon name="arrow" className="h-4 w-4" />
                </span>
              </a>
            ) : null}
          </div>
        ) : null}

<div
  className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-[11px] text-white/55 sm:hidden"
  dir={isRtl ? "rtl" : "ltr"}
>
  {isRtl ? (
    <>
      <span className="shrink-0 whitespace-nowrap text-white">
        {budget}
      </span>

      {workDuration ? (
        <>
          <span className="shrink-0 text-white/20">·</span>
          <span className="shrink-0 whitespace-nowrap">
            {workDuration}
          </span>
        </>
      ) : null}

      {requiredCount !== null ? (
        <>
          <span className="shrink-0 text-white/20">·</span>
          <span
            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap"
            dir="rtl"
          >
            <span>مطلوب:</span>
            <bdi dir="ltr">{requiredCount}</bdi>
          </span>
        </>
      ) : null}
    </>
  ) : (
    <>
      <span className="shrink-0 whitespace-nowrap text-white">
        {budget}
      </span>

      {workDuration ? (
        <>
          <span className="shrink-0 text-white/20">·</span>
          <span className="shrink-0 whitespace-nowrap">
            {workDuration}
          </span>
        </>
      ) : null}

      {requiredCount !== null ? (
        <>
          <span className="shrink-0 text-white/20">·</span>
          <span className="shrink-0 whitespace-nowrap">
            Required: {requiredCount}
          </span>
        </>
      ) : null}
    </>
  )}
</div>
      </div>
      {user &&
profile?.account_type === "talent" ? (
  <div className="mt-3 sm:hidden">
    <form action={toggleSavedOpportunityAction}>
      <button
        type="submit"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-xs transition ${
          isSaved
            ? "border-gold/40 bg-gold/[0.10] text-gold"
            : "border-white/10 bg-black/20 text-white/60 active:border-gold/35 active:text-gold"
        }`}
      >
        <span className="text-base leading-none">
          {isSaved ? "♥" : "♡"}
        </span>

        <span>
          {isSaved
            ? isRtl
              ? "تم الحفظ"
              : "Saved"
            : isRtl
              ? "حفظ للمفضلة"
              : "Save to favorites"}
        </span>
      </button>
    </form>
  </div>
) : null}

{publicIsOpen &&
user &&
profile?.account_type === "talent" &&
!isTalentApproved ? (
  <div className="mt-3 sm:hidden">
    <ApplyArea
      locale={locale}
      isRtl={isRtl}
      isOpen={publicIsOpen}
      canApply={canApply}
      isLoggedIn={Boolean(user)}
      isTalent={true}
      approvalStatus={approvalStatus}
      existingApplication={existingApplication}
      opportunityId={Number(opportunity.id)}
      compact
    />
  </div>
) : null}

      <div className="hidden w-full shrink-0 sm:block xl:w-[310px]">
      <div className="rounded-[1.35rem] border border-white/10 bg-black/35 p-4 backdrop-blur-xl sm:rounded-[1.75rem] sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/35">
            {isRtl
              ? "حالة استقبال الطلبات"
              : "Application Window"}
          </p>

          <p
            className={`mt-0.5 hidden truncate text-[10px] min-[360px]:block ${
              deadlineDisplay.isUrgent
                ? "text-amber-200"
                : "text-emerald-200"
            }`}
          >
            {deadlineDisplay.detail}
          </p>

          {deadline ? (
            <p className="mt-2 text-xs leading-6 text-white/35">
              {isRtl ? "آخر موعد: " : "Deadline: "}
              {deadline}
            </p>
          ) : null}

{applicationProgress ? (
  <div className="mt-4 sm:mt-5">
    <div className="flex items-center justify-between gap-4 text-[10px] text-white/35">
      <span>
        {isRtl
          ? "مدة استقبال الطلبات"
          : "Application Window"}
      </span>

      <span>
        {applicationProgress.percentage}%
      </span>
    </div>

    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-all ${
          applicationProgress.hasEnded
            ? "bg-red-300"
            : applicationProgress.percentage >= 75
              ? "bg-amber-300"
              : "bg-emerald-300"
        }`}
        style={{
          width: `${applicationProgress.percentage}%`,
        }}
      />
    </div>

    <div className="mt-3 hidden grid-cols-2 gap-3 text-[10px] leading-5 text-white/30 sm:grid">
      <div>
        <span className="block">
          {isRtl ? "بدأ التقديم" : "Started"}
        </span>

        <span className="mt-1 block text-white/50">
          {applicationStartDate || "—"}
        </span>
      </div>

      <div>
        <span className="block">
          {isRtl ? "ينتهي التقديم" : "Closes"}
        </span>

        <span className="mt-1 block text-white/50">
          {deadline || "—"}
        </span>
      </div>
    </div>
  </div>
) : null}

          {canViewApplicationArea ? (
            <div className="mt-6 hidden lg:block">
              <ApplyArea
                locale={locale}
                isRtl={isRtl}
                isOpen={publicIsOpen}
                canApply={canApply}
                isLoggedIn={Boolean(user)}
isTalent={profile?.account_type === "talent"}
approvalStatus={approvalStatus}
                existingApplication={existingApplication}
                opportunityId={Number(opportunity.id)}
              />
            </div>
          ) : null}

<div className="mt-3 flex flex-wrap items-center gap-2">
  {user && profile?.account_type === "talent" ? (
    <form action={toggleSavedOpportunityAction}>
      <button
        type="submit"
        className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 text-[10px] transition duration-300 sm:min-h-11 sm:px-4 sm:text-xs ${
          isSaved
            ? "border-gold/40 bg-gold/[0.10] text-gold"
            : "border-white/10 text-white/55 hover:border-gold/35 hover:bg-gold/[0.05] hover:text-gold"
        }`}
      >
        <span className="text-base leading-none">
          {isSaved ? "♥" : "♡"}
        </span>

        <span>
        {isSaved
  ? isRtl
    ? "تم الحفظ"
    : "Saved"
  : isRtl
    ? "حفظ للمفضلة"
    : "Save to favorites"}
        </span>
      </button>
    </form>
  ) : null}

<OpportunityShareButton
  opportunityId={Number(opportunity.id)}
  title={
    opportunity.title ||
    (isRtl
      ? "فرصة من ملامح"
      : "MLAMH Opportunity")
  }
/>
</div>
        </div>
      </div>
    </div>

    <div className="mt-9 hidden overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/25 sm:grid sm:grid-cols-2 lg:grid-cols-4">
      <HeroStat
        icon="wallet"
        label={isRtl ? "المقابل المالي" : "Compensation"}
        value={budget}
      />

      <HeroStat
        icon="age"
        label={ageDisplay.title}
        value={ageDisplay.detail}
      />

      <HeroStat
        icon="gender"
        label={isRtl ? "الجنس المطلوب" : "Required Gender"}
        value={gender}
      />

      <HeroStat
        icon="briefcase"
        label={isRtl ? "نوع الفرصة" : "Opportunity Type"}
        value={opportunityType}
      />
    </div>
  </div>
  </header>

  <nav
  aria-label={
    isRtl
      ? "التنقل داخل تفاصيل الفرصة"
      : "Opportunity page navigation"
  }
  className="relative z-20 mt-3 max-w-full rounded-2xl border border-white/10 bg-black/70 p-1.5 sm:sticky sm:top-20 sm:mt-4 sm:p-2 sm:shadow-lg sm:backdrop-blur-xl lg:top-24"
>
<div className="flex max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
    <span className="hidden sm:contents">
      <OpportunityNavLink
        href="#opportunity-overview"
        label={isRtl ? "نظرة سريعة" : "Overview"}
      />
    </span>

    <OpportunityNavLink
      href="#opportunity-requirements"
      label={isRtl ? "المتطلبات" : "Requirements"}
    />

    {hasMeaningfulDescription ? (
      <OpportunityNavLink
        href="#opportunity-description"
        label={isRtl ? "الوصف" : "Description"}
      />
    ) : null}

    <OpportunityNavLink
      href="#application-journey"
      label={isRtl ? "رحلة الطلب" : "Journey"}
    />

    <OpportunityNavLink
      href="#opportunity-faq"
      label={isRtl ? "الأسئلة" : "FAQ"}
    />
  </div>
</nav>

<div className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="min-w-0 space-y-4 sm:space-y-5">
          <section
  id="opportunity-overview"
  className="hidden scroll-mt-32 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:block sm:rounded-[2rem]"
>
  <div className="border-b border-white/10 p-4
sm:p-6
lg:p-8">
    <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
      {isRtl ? "نظرة سريعة" : "Quick Overview"}
    </p>

    <h2 className="mt-2 text-2xl font-light sm:text-3xl">
      {isRtl
        ? "أهم معلومات الفرصة"
        : "Opportunity at a Glance"}
    </h2>

    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
      {isRtl
        ? "راجع أهم تفاصيل العمل والتقديم قبل اتخاذ قرارك."
        : "Review the key work and application details before deciding."}
    </p>
  </div>

  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] bg-white/10 xl:grid-cols-3">
    <QuickFact icon="city" label={isRtl ? "الموقع" : "Location"} value={city} />
    <QuickFact icon="wallet" label={isRtl ? "الميزانية" : "Budget"} value={budget} />
    <QuickFact icon="calendar" label={isRtl ? "تاريخ العمل" : "Work Date"} value={workDate || (isRtl ? "غير محدد" : "Not specified")} />
    <QuickFact icon="clock" label={isRtl ? "مدة العمل" : "Duration"} value={workDuration || (isRtl ? "غير محددة" : "Not specified")} />
    <QuickFact icon="briefcase" label={isRtl ? "عدد المواهب" : "Required Talents"} value={requiredCount ?? (isRtl ? "غير محدد" : "Not specified")} />
    <QuickFact
      icon="clock"
      label={isRtl ? "حالة التقديم" : "Application Status"}
      value={deadlineDisplay.detail}
      tone={deadlineDisplay.isExpired ? "danger" : deadlineDisplay.isUrgent ? "warning" : "success"}
    />
  </div>
</section>
<section className="hidden rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:block sm:p-6 lg:p-8">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
        {isRtl
          ? "مميزات الفرصة"
          : "Opportunity Highlights"}
      </p>

      <h2 className="mt-2 text-2xl font-light text-white sm:text-3xl">
        {isRtl
          ? "أهم ما تحتاج معرفته"
          : "What you need to know"}
      </h2>
    </div>

    <p className="max-w-md text-sm leading-7 text-white/40">
      {isRtl
        ? "ملخص سريع مبني على معلومات الفرصة المنشورة."
        : "A quick summary based on the published opportunity details."}
    </p>
  </div>

  <div className="mt-7 grid gap-3 sm:grid-cols-2">
    {opportunityHighlights.map((highlight) => (
      <OpportunityHighlight
        key={`${highlight.title}-${highlight.description}`}
        icon={highlight.icon}
        title={highlight.title}
        description={highlight.description}
        tone={highlight.tone}
      />
    ))}
  </div>
</section>
<section
  id="opportunity-requirements"
  className="scroll-mt-32 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 lg:p-8"
>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
        {isRtl ? "المتطلبات" : "Requirements"}
      </p>

      <h2 className="mt-2 text-2xl font-light sm:text-3xl">
        {isRtl
          ? "من تبحث عنه الجهة؟"
          : "Who is the publisher looking for?"}
      </h2>
    </div>

    <p className="max-w-md text-sm leading-7 text-white/40">
      {isRtl
        ? "راجع المتطلبات الأساسية وتأكد من مناسبتها لملفك قبل إرسال الطلب."
        : "Review the essential requirements before submitting your application."}
    </p>
  </div>

  <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-7 sm:gap-3">
    <RequirementItem
      icon="age"
      label={isRtl ? "الفئة العمرية" : "Age Range"}
      value={`${ageDisplay.title} — ${ageDisplay.detail}`}
    />

    <RequirementItem
      icon="gender"
      label={isRtl ? "الجنس المطلوب" : "Required Gender"}
      value={gender}
    />

    <div className="col-span-2 sm:col-span-1">
      <RequirementItem
        icon="briefcase"
        label={isRtl ? "نوع الموهبة" : "Talent Type"}
        value={opportunityType}
      />
    </div>

  </div>

  {roleRequirementItems.length > 0 ? (
    <div className="mt-5 border-t border-white/10 pt-5 sm:mt-7 sm:pt-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
        {isRtl ? "متطلبات التخصص" : "Role Requirements"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
        {roleRequirementItems.map((item) => (
          <RequirementItem
            key={`${item.label}-${item.value}`}
            icon="briefcase"
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </div>
  ) : null}
</section>
{hasMeaningfulDescription ? (
  <section
    id="opportunity-description"
    className="scroll-mt-32 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 sm:rounded-[2rem] sm:p-6 lg:p-8"
  >
    <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
      {isRtl ? "حول الفرصة" : "About the Opportunity"}
    </p>

    <h2 className="mt-2 text-2xl font-light sm:text-3xl">
      {isRtl ? "الوصف الكامل" : "Full Description"}
    </h2>

    <p className="mt-4 max-w-none whitespace-pre-line break-words [overflow-wrap:anywhere] text-sm leading-7 text-white/60 sm:mt-6 sm:max-w-[75ch] sm:text-base sm:leading-8">
      {opportunityDescription}
    </p>
  </section>
) : null}
        
            <section
  id="application-journey"
  className="scroll-mt-32 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]"
>
  <div className="border-b border-white/10 p-4
sm:p-6
lg:p-8">
    <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
      {isRtl ? "رحلة الطلب" : "Application Journey"}
    </p>

    <h2 className="mt-2 text-2xl font-light sm:text-3xl">
      {isRtl
        ? "ماذا يحدث بعد التقديم؟"
        : "What happens after you apply?"}
    </h2>

    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
      {isRtl
        ? "يمكنك متابعة حالة طلبك من لوحة الموهبة بعد إرساله."
        : "You can track the application status from your talent dashboard after submission."}
    </p>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
    <ProcessStep
      number="01"
      title={isRtl ? "إرسال الطلب" : "Submit"}
      description={
        isRtl
          ? "اضغط على زر التقديم لإرسال طلبك إلى الجهة."
          : "Use the apply button to send your application."
      }
    />

    <ProcessStep
      number="02"
      title={isRtl ? "استلام الطلب" : "Received"}
      description={
        isRtl
          ? "يُسجل الطلب داخل المنصة بحالة تم التقديم."
          : "Your application is recorded on the platform."
      }
    />

    <ProcessStep
      number="03"
      title={isRtl ? "مراجعة الجهة" : "Publisher Review"}
      description={
        isRtl
          ? "تراجع الجهة ملفك وبيانات طلبك."
          : "The publisher reviews your profile and application."
      }
    />

    <ProcessStep
      number="04"
      title={isRtl ? "متابعة الحالة" : "Track Status"}
      description={
        isRtl
          ? "تابع آخر تحديث من صفحة طلباتي."
          : "Follow the latest update from My Applications."
      }
    />
  </div>
  </section>

  <section
  id="opportunity-faq"
  className="scroll-mt-32 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]"
>
  <div className="border-b border-white/10 p-4
sm:p-6
lg:p-8">
    <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
      {isRtl ? "معلومات مهمة" : "Helpful Information"}
    </p>

    <h2 className="mt-2 text-2xl font-light text-white sm:text-3xl">
      {isRtl
        ? "أسئلة شائعة قبل التقديم"
        : "Frequently Asked Questions"}
    </h2>

    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
      {isRtl
        ? "إجابات سريعة عن إرسال الطلب ومتابعته عبر منصة ملامح."
        : "Quick answers about submitting and tracking your application through MLAMH."}
    </p>
  </div>

  <div className="divide-y divide-white/10">
    <FaqItem
      question={
        isRtl
          ? "هل يمكنني التقديم أكثر من مرة على الفرصة نفسها؟"
          : "Can I apply more than once?"
      }
      answer={
        isRtl
          ? "لا. يسجل النظام طلبًا واحدًا فقط لكل موهبة على الفرصة نفسها، ويمكنك متابعة حالته من صفحة طلباتي."
          : "No. Only one application is recorded per talent for the same opportunity, and you can track it from My Applications."
      }
    />

    <FaqItem
      question={
        isRtl
          ? "هل أحتاج إلى تسجيل الدخول؟"
          : "Do I need to sign in?"
      }
      answer={
        isRtl
          ? "نعم. يجب تسجيل الدخول بحساب موهبة ووجود ملف مهني حتى تتمكن من إرسال الطلب."
          : "Yes. You must sign in with a talent account and have a professional profile before applying."
      }
    />

    <FaqItem
      question={
        isRtl
          ? "ماذا تستلم الجهة عند التقديم؟"
          : "What does the publisher receive?"
      }
      answer={
        isRtl
          ? "يرتبط طلبك بملف الموهبة داخل ملامح، حتى تتمكن الجهة من مراجعة بياناتك المهنية وأعمالك المتاحة."
          : "Your application is linked to your MLAMH talent profile so the publisher can review your available professional details and work."
      }
    />

    <div className="hidden divide-y divide-white/10 sm:block">
      <FaqItem
        question={
          isRtl
            ? "كيف أعرف أن حالة طلبي تغيرت؟"
            : "How can I track application updates?"
        }
        answer={
          isRtl
            ? "يمكنك مراجعة آخر حالة من صفحة طلباتي في لوحة الموهبة، وستظهر هناك التحديثات المرتبطة بالطلب."
            : "You can review the latest status from My Applications in your talent dashboard."
        }
      />

      <FaqItem
        question={
          isRtl
            ? "هل يمكنني التقديم بعد انتهاء الموعد؟"
            : "Can I apply after the deadline?"
        }
        answer={
          isRtl
            ? "لا. يتوقف استقبال الطلبات تلقائيًا بعد انتهاء الموعد المحدد للفرصة."
            : "No. Applications automatically close after the opportunity deadline."
        }
      />
    </div>

    <details className="group sm:hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-center gap-2 px-4 text-sm text-gold">
        <span className="group-open:hidden">
          {isRtl ? "عرض المزيد" : "Show More"}
        </span>
        <span className="hidden group-open:inline">
          {isRtl ? "عرض أقل" : "Show Less"}
        </span>
        <span className="text-base transition-transform group-open:rotate-45">+</span>
      </summary>

      <div className="divide-y divide-white/10 border-t border-white/10">
        <FaqItem
          question={
            isRtl
              ? "كيف أعرف أن حالة طلبي تغيرت؟"
              : "How can I track application updates?"
          }
          answer={
            isRtl
              ? "يمكنك مراجعة آخر حالة من صفحة طلباتي في لوحة الموهبة، وستظهر هناك التحديثات المرتبطة بالطلب."
              : "You can review the latest status from My Applications in your talent dashboard."
          }
        />

        <FaqItem
          question={
            isRtl
              ? "هل يمكنني التقديم بعد انتهاء الموعد؟"
              : "Can I apply after the deadline?"
          }
          answer={
            isRtl
              ? "لا. يتوقف استقبال الطلبات تلقائيًا بعد انتهاء الموعد المحدد للفرصة."
              : "No. Applications automatically close after the opportunity deadline."
          }
        />
      </div>
    </details>
  </div>
</section>

<section className="relative hidden overflow-hidden rounded-[1.5rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.16),transparent_42%),rgba(201,169,98,0.035)] p-5 sm:block sm:rounded-[2rem] sm:p-8">
  <div className="pointer-events-none absolute -bottom-24 -start-20 h-64 w-64 rounded-full bg-gold/[0.05] blur-3xl" />

  <div className="relative">
  <div className="flex flex-col gap-5 sm:gap-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "خطوتك التالية" : "Your Next Step"}
        </p>

        <h2 className="mt-3 text-[1.7rem] font-light leading-tight text-white sm:text-4xl">
          {existingApplication
            ? isRtl
              ? "تم إرسال طلبك بنجاح"
              : "Your application has been submitted"
            : publicIsOpen
              ? isRtl
                ? "هل ترى نفسك مناسبًا لهذه الفرصة؟"
                : "Do you see yourself in this opportunity?"
              : isRtl
                ? "انتهى استقبال الطلبات"
                : "Applications are now closed"}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-7 text-white/45 sm:mt-4 sm:leading-8">
          {existingApplication
            ? isRtl
              ? "تابع حالة الطلب وأي تحديثات جديدة من صفحة طلباتي."
              : "Track your application and any new updates from My Applications."
            : publicIsOpen
              ? isRtl
                ? "راجع ملفك المهني وصورك، ثم أرسل طلبك مباشرة عبر منصة ملامح."
                : "Review your professional profile and photos, then submit directly through MLAMH."
              : isRtl
                ? "يمكنك العودة إلى صفحة الفرص واكتشاف فرص أخرى متاحة."
                : "Return to the opportunities page to discover other available roles."}
        </p>

        <div className="mt-4 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3">
          <TrustItem
            text={
              isRtl
                ? "بياناتك تبقى داخل منصة ملامح."
                : "Your data remains within the MLAMH platform."
            }
          />

          <TrustItem
            text={
              isRtl
                ? "يمكنك متابعة حالة الطلب في أي وقت."
                : "You can track the application at any time."
            }
          />
        </div>
      </div>

      <div className="w-full shrink-0 lg:w-[310px]">
        {canViewApplicationArea ? (
          <ApplyArea
            locale={locale}
            isRtl={isRtl}
            isOpen={publicIsOpen}
            canApply={canApply}
            isLoggedIn={Boolean(user)}
isTalent={profile?.account_type === "talent"}
approvalStatus={approvalStatus}
            existingApplication={existingApplication}
            opportunityId={Number(opportunity.id)}
          />
        ) : (
          <Link
            href={`/${locale}/opportunities`}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-gold/35 px-6 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl
              ? "استعراض الفرص"
              : "Browse Opportunities"}

            <span className={isRtl ? "rotate-180" : ""}>
              <OpportunityIcon
                name="arrow"
                className="h-4 w-4"
              />
            </span>
          </Link>
        )}

        <p className="mt-3 text-center text-[11px] leading-6 text-white/25">
          {isRtl
            ? "لن يتم إرسال طلب مكرر للفرصة نفسها."
            : "A duplicate application will not be submitted."}
        </p>
      </div>
    </div>
  </div>
</section>
{relatedOpportunities.length > 0 ? (
  <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]">
    <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6 lg:p-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "اكتشف المزيد" : "Discover More"}
        </p>

        <h2 className="mt-2 text-xl font-light text-white sm:text-3xl">
          {isRtl
            ? "فرص مشابهة قد تناسبك"
            : "Similar Opportunities"}
        </h2>

        <p className="mt-2 max-w-xl text-xs leading-6 text-white/40 sm:mt-3 sm:text-sm sm:leading-7">
          {isRtl
            ? "فرص قريبة من النوع أو المدينة الخاصة بهذه الفرصة."
            : "Opportunities with a similar type or location."}
        </p>
      </div>

      <Link
        href={`/${locale}/opportunities`}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/35 hover:text-gold sm:min-h-11 sm:px-5"
      >
        {isRtl ? "عرض جميع الفرص" : "View All"}

        <span className={isRtl ? "rotate-180" : ""}>
          <OpportunityIcon
            name="arrow"
            className="h-4 w-4"
          />
        </span>
      </Link>
    </div>

    <div
  className={`flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:gap-px lg:overflow-visible lg:bg-white/10 lg:p-0 ${
    relatedOpportunities.length === 1
      ? "lg:grid-cols-1"
      : relatedOpportunities.length === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-3"
  }`}
>
      {relatedOpportunities.map(
        (relatedOpportunity: PublishedOpportunity) => (
          <div
            key={relatedOpportunity.id}
            className="w-[86%] max-w-[360px] shrink-0 snap-start sm:w-[60%] lg:w-auto lg:max-w-none lg:shrink"
          >
            <RelatedOpportunityCard
              locale={locale}
              isRtl={isRtl}
              opportunity={relatedOpportunity}
            />
          </div>
        ),
      )}
    </div>
  </section>
) : null}
</div>

<aside className="min-w-0 space-y-4 sm:space-y-5 lg:sticky lg:top-32 lg:self-start">
{canViewApplicationArea && (
              <section className="hidden rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_45%),rgba(201,169,98,0.035)] p-5 lg:block lg:p-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "حالة التقديم" : "Application Status"}
                </p>

                <h2 className="mt-3 text-2xl font-light text-white">
  {existingApplication
    ? isRtl
      ? "تم استلام طلبك"
      : "Application Received"
    : publicIsOpen
      ? isRtl
        ? "جاهز للتقديم؟"
        : "Ready to Apply?"
      : isRtl
        ? "التقديم غير متاح"
        : "Applications Unavailable"}
</h2>

<p className="mt-3 text-sm leading-7 text-white/40">
  {existingApplication
    ? isRtl
      ? "يمكنك متابعة آخر تحديثات الطلب من لوحة الموهبة."
      : "Track the latest updates from your talent dashboard."
    : publicIsOpen
      ? isRtl
        ? "راجع التفاصيل ثم أرسل طلبك عندما تكون مستعدًا."
        : "Review the details, then submit when you are ready."
      : isRtl
        ? "انتهت مدة استقبال الطلبات لهذه الفرصة."
        : "The application period for this opportunity has ended."}
</p>

                <div className="mt-5">
  {existingApplication ? (
    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/20 text-emerald-200">
        <OpportunityIcon name="check" />
      </div>

      <p className="mt-4 text-lg font-light text-emerald-100">
        {getApplicationStatusLabel(
          existingApplication.status,
          isRtl,
        )}
      </p>

      <p className="mt-2 text-sm leading-7 text-white/45">
        {isRtl
          ? "يمكنك متابعة حالة هذا الطلب من صفحة طلباتي."
          : "You can track this application from My Applications."}
      </p>

      <Link
        href={`/${locale}/talent-dashboard/applications`}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/20 text-xs text-emerald-200 transition hover:bg-emerald-300/[0.07]"
      >
        {isRtl ? "عرض طلباتي" : "View My Applications"}
      </Link>
    </div>
  ) : (
    <div>
  <div className="space-y-3">
    <TrustItem
      text={
        isRtl
          ? "التقديم مجاني عبر منصة ملامح."
          : "Applying is free through MLAMH."
      }
    />

    <TrustItem
      text={
        isRtl
          ? "يتم إرسال ملفك المهني إلى الجهة مباشرة."
          : "Your professional profile is sent directly to the publisher."
      }
    />

    <TrustItem
      text={
        isRtl
          ? "يمكنك متابعة حالة الطلب من صفحة طلباتي."
          : "You can track the application from My Applications."
      }
    />
  </div>

  <div className="mt-6 hidden lg:block">
    <ApplyArea
      locale={locale}
      isRtl={isRtl}
      isOpen={publicIsOpen}
      canApply={canApply}
      isLoggedIn={Boolean(user)}
isTalent={profile?.account_type === "talent"}
approvalStatus={approvalStatus}
      existingApplication={existingApplication}
      opportunityId={Number(opportunity.id)}
    />
  </div>

  {publicIsOpen && !existingApplication ? (
    <p className="mt-3 text-center text-[11px] leading-6 text-white/30">
      {isRtl
        ? "تأكد من اكتمال ملفك وصورك قبل إرسال الطلب."
        : "Make sure your profile and photos are complete before applying."}
    </p>
  ) : null}
</div>
  )}
</div>
              </section>
            )}

<section className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] transition duration-300 hover:border-gold/20 hover:bg-white/[0.035] sm:rounded-[2rem]">
  <div className="p-5 sm:p-6">
    <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
      {isRtl ? "الجهة الناشرة" : "Opportunity Publisher"}
    </p>

    <div className="mt-5 flex items-center gap-4">
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.06] text-gold transition duration-300 group-hover:-translate-y-0.5 group-hover:border-gold/35 group-hover:bg-gold/[0.1]">
        <OpportunityIcon
          name="company"
          className="h-7 w-7"
        />
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-xl font-light text-white">
          {companyName}
        </h2>

        <p className="mt-1 text-xs leading-6 text-white/35">
          {isRtl
            ? "الجهة المسؤولة عن نشر الفرصة ومراجعة الطلبات."
            : "The publisher responsible for this opportunity and its applications."}
        </p>
      </div>
    </div>
  </div>

  <div className="border-t border-white/10 p-5 sm:p-6">
  <div className="flex items-start gap-2.5 sm:gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200">
      <OpportunityIcon
        name="check"
        className="h-5 w-5"
      />
    </div>

    <div>
      <p className="text-sm font-light leading-7 text-white">
        {isRtl
          ? "تواصل آمن عبر ملامح"
          : "Secure Communication through MLAMH"}
      </p>

      <p className="mt-1 text-xs leading-6 text-white/35">
        {isRtl
          ? "تحمي ملامح بيانات التواصل، ويتم إشعار المرشحين عند تحديث حالة الطلب أو اختيارهم من الجهة."
          : "MLAMH protects contact details and notifies applicants when their status changes or they are selected by the publisher."}
      </p>
    </div>
  </div>

  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="text-[9px] leading-4 text-white/30 sm:text-[10px] sm:uppercase sm:tracking-[0.18em]">
      {isRtl ? "تنبيه للموهبة" : "Talent Notice"}
    </p>

    <p className="mt-2 text-xs leading-6 text-white/45">
      {isRtl
        ? "لا ترسل بيانات حساسة أو مبالغ مالية خارج المنصة قبل التحقق من الجهة وتفاصيل المشروع."
        : "Do not share sensitive information or send payments outside the platform before verifying the publisher and project details."}
    </p>
  </div>
</div>
</section>

          </aside>
        </div>
      </div>

      {canViewApplicationArea &&
  shouldPinMobileApplicationArea && (
  <div
    className="
      fixed
      inset-x-0
      bottom-[calc(4.75rem+env(safe-area-inset-bottom))]
      z-[9000]
      border-t
      border-white/10
      bg-black/95
      px-3
      py-2
      shadow-[0_-12px_30px_rgba(0,0,0,0.35)]
      backdrop-blur-xl
      lg:hidden
    "
  >
    <div className="mx-auto w-full max-w-lg">
      <div className="w-full">
        <ApplyArea
          locale={locale}
          isRtl={isRtl}
          isOpen={publicIsOpen}
          canApply={canApply}
          isLoggedIn={Boolean(user)}
isTalent={profile?.account_type === "talent"}
approvalStatus={approvalStatus}
          existingApplication={existingApplication}
          opportunityId={Number(opportunity.id)}
          compact
        />
      </div>
    </div>
  </div>
)}
    </main>
  );
}

function ApplyArea({
  locale,
  isRtl,
  isOpen,
  canApply,
  isLoggedIn,
  isTalent,
  approvalStatus,
  existingApplication,
  opportunityId,
  compact = false,
}: {
  locale: string;
  isRtl: boolean;
  isOpen: boolean;
  canApply: boolean;
  isLoggedIn: boolean;
  isTalent: boolean;
  approvalStatus: string;
  existingApplication: { id: number | string; status: string | null } | null;
  opportunityId: number;
  compact?: boolean;
}) {
  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-red-300/20 bg-red-300/[0.07] p-4 text-center text-sm text-red-200">
        {isRtl
          ? "هذه الفرصة مغلقة حاليًا."
          : "This opportunity is currently closed."}
      </div>
    );
  }

  if (existingApplication) {
    return (
      <Link
        href={`/${locale}/talent-dashboard/applications`}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] px-5 text-sm text-emerald-200 transition hover:bg-emerald-300/[0.1]"
      >
        <OpportunityIcon name="check" />
        {getApplicationStatusLabel(existingApplication.status, isRtl)}
      </Link>
    );
  }

  if (canApply) {
    return (
      <form
      action={async (formData: FormData) => {
        "use server";
    
        const result = await applyToOpportunityAction(
          null,
          formData,
        );
        
        console.log(
          "[Apply opportunity result]",
          result,
        );
      }}
    >
        <input
          type="hidden"
          name="locale"
          value={locale}
        />
  
        <input
          type="hidden"
          name="opportunity_id"
          value={opportunityId}
        />
  
        <button
          type="submit"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold font-medium text-black transition hover:bg-gold-soft active:scale-[0.98] ${
            compact
              ? "min-h-12 px-3 text-xs"
              : "min-h-14 px-6 text-sm"
          }`}
        >
          <OpportunityIcon name="briefcase" />
  
          {isRtl
            ? "التقديم على الفرصة"
            : "Apply for Opportunity"}
        </button>
      </form>
    );
  }
  if (
    isLoggedIn &&
    isTalent &&
    approvalStatus !== "approved"
  ) {
    const statusContent =
      approvalStatus === "pending" ||
      approvalStatus === "submitted"
        ? {
            title: isRtl
              ? "ملفك قيد المراجعة"
              : "Your profile is under review",
            description: isRtl
              ? "يمكنك التقديم على الفرص بعد اعتماد ملفك."
              : "You can apply once your profile is approved.",
          }
        : approvalStatus === "changes_requested"
          ? {
              title: isRtl
                ? "مطلوب تعديل ملفك"
                : "Profile changes required",
              description: isRtl
                ? "راجع التعديلات المطلوبة، ثم أعد إرسال ملفك للمراجعة."
                : "Complete the requested changes, then resubmit your profile.",
            }
          : approvalStatus === "rejected"
            ? {
                title: isRtl
                  ? "لم يتم اعتماد ملفك"
                  : "Your profile was not approved",
                description: isRtl
                  ? "راجع بيانات ملفك قبل اتخاذ الخطوة التالية."
                  : "Review your profile before taking the next step.",
              }
            : {
                title: isRtl
                  ? "ملفك لم يُرسل للمراجعة"
                  : "Your profile has not been submitted",
                description: isRtl
                  ? "أكمل ملفك ثم أرسله للمراجعة لتتمكن من التقديم."
                  : "Complete and submit your profile for review before applying.",
              };
  
    return (
      <div
        className={`w-full rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] text-center text-amber-100 ${
          compact
            ? "px-3 py-3 text-xs"
            : "px-5 py-4 text-sm"
        }`}
      >
        <div className="font-medium">
          {statusContent.title}
        </div>
  
        <div className="mt-1 text-[11px] leading-5 text-amber-100/60">
          {statusContent.description}
        </div>
      </div>
    );
  }
  return (
    <Link
    href={`/${locale}/login`}
    className={`inline-flex w-full items-center justify-center rounded-2xl border border-gold/40 text-center font-medium text-gold transition hover:bg-gold hover:text-black active:scale-[0.98] ${
      compact
        ? "min-h-12 px-3 text-xs"
        : "min-h-14 px-6 text-sm"
    }`}
    >
      {isRtl ? "سجّل الدخول كموهبة للتقديم" : "Login as Talent to Apply"}
    </Link>
  );
}
function OpportunityNavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-10 shrink-0 snap-start items-center justify-center rounded-xl border border-transparent px-3 text-center text-[11px] leading-5 text-white/45 transition duration-300 hover:border-gold/20 hover:bg-gold/[0.05] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 sm:px-4 sm:text-xs"
    >
      {label}
    </a>
  );
}
function HeroStat({
  icon,
  label,
  value,
}: {
  icon:
    | "wallet"
    | "age"
    | "gender"
    | "briefcase";
  label: string;
  value: string | number;
}) {
  return (
    <article className="border-b border-white/10 p-5 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0 lg:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
          <OpportunityIcon name={icon} />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            {label}
          </p>

          <p className="mt-2 break-words text-sm font-light leading-6 text-white sm:text-base">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}
function RelatedOpportunityCard({
  locale,
  isRtl,
  opportunity,
}: {
  locale: string;
  isRtl: boolean;
  opportunity: {
    id: number | string;
    slug?: string | null;
    title?: string | null;
    opportunity_type?: string | null;
    city_ar?: string | null;
    city_en?: string | null;
    compensation_type?: string | null;
    budget?: string | number | null;
    min_age?: number | null;
    max_age?: number | null;
    application_deadline?: string | null;
  };
}) {
  const city = isRtl
    ? opportunity.city_ar ||
      opportunity.city_en ||
      "—"
    : opportunity.city_en ||
      opportunity.city_ar ||
      "—";

  const opportunityType =
    getOpportunityTypeLabel(
      opportunity.opportunity_type,
      isRtl,
    );

  const budget = formatCompensation(
    opportunity.compensation_type,
    opportunity.budget,
    isRtl,
  );

  const age = getAgeDisplay(
    opportunity.min_age,
    opportunity.max_age,
    isRtl,
  );

  const deadline = getDeadlineDisplay(
    opportunity.application_deadline,
    isRtl,
  );

  const hrefValue =
    opportunity.slug || String(opportunity.id);

  return (
    <Link
  href={`/${locale}/opportunities/${encodeURIComponent(
    hrefValue,
  )}`}
  className="group block h-full min-w-0 max-w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#090909] p-4 transition hover:bg-white/[0.035] sm:rounded-[1.5rem] sm:p-6 lg:rounded-none lg:border-0"
>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold transition group-hover:border-gold/35 group-hover:bg-gold/[0.08]">
          <OpportunityIcon
            name="briefcase"
            className="h-5 w-5"
          />
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-[9px] ${
            deadline.isExpired
              ? "border-red-300/20 bg-red-300/[0.05] text-red-200"
              : deadline.isUrgent
                ? "border-amber-300/20 bg-amber-300/[0.05] text-amber-200"
                : "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200"
          }`}
        >
          {deadline.label}
        </span>
      </div>

      <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-gold/70 sm:mt-6 sm:text-[10px] sm:tracking-[0.2em]">
        {opportunityType}
      </p>

      <h3 className="mt-1.5 line-clamp-2 min-w-0 break-words [overflow-wrap:anywhere] text-base font-light leading-6 text-white transition group-hover:text-gold sm:mt-2 sm:text-xl sm:leading-8">
        {opportunity.title ||
          (isRtl
            ? "فرصة بدون عنوان"
            : "Untitled Opportunity")}
      </h3>

      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-[11px] text-white/40 sm:mt-5 sm:space-y-3 sm:pt-5 sm:text-xs">
        <div className="flex items-center gap-2">
          <OpportunityIcon
            name="city"
            className="h-4 w-4 text-gold/70"
          />

          <span className="min-w-0 break-words [overflow-wrap:anywhere]">{city}</span>
        </div>

        <div className="flex items-center gap-2">
          <OpportunityIcon
            name="age"
            className="h-4 w-4 text-gold/70"
          />

          <span>{age.detail}</span>
        </div>

        <div className="flex items-center gap-2">
          <OpportunityIcon
            name="wallet"
            className="h-4 w-4 text-gold/70"
          />

          <span>{budget}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:mt-6 sm:pt-4">
        <span className="text-xs text-white/35">
          {deadline.detail}
        </span>

        <span className="inline-flex items-center gap-2 text-xs text-gold">
          {isRtl ? "عرض الفرصة" : "View Opportunity"}

          <span className={isRtl ? "rotate-180" : ""}>
            <OpportunityIcon
              name="arrow"
              className="h-4 w-4 transition group-hover:translate-x-1"
            />
          </span>
        </span>
      </div>
    </Link>
  );
}

function TrustItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200 sm:h-6 sm:w-6">
        <OpportunityIcon
          name="check"
          className="h-3 w-3 sm:h-3.5 sm:w-3.5"
        />
      </div>

      <p className="text-xs leading-6 text-white/45 sm:text-sm sm:leading-7">
        {text}
      </p>
    </div>
  );
}
function OpportunityHighlight({
  icon,
  title,
  description,
  tone = "default",
}: {
  icon: "clock" | "wallet" | "age" | "city" | "check";
  title: string;
  description: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const iconClass =
    tone === "success"
      ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200"
      : tone === "warning"
        ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200"
        : tone === "danger"
          ? "border-red-300/20 bg-red-300/[0.06] text-red-200"
          : "border-gold/20 bg-gold/[0.05] text-gold";

  return (
    <article className="group flex items-start gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 transition hover:border-gold/20 hover:bg-white/[0.025]">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClass}`}
      >
        <OpportunityIcon
          name={icon}
          className="h-5 w-5"
        />
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-light leading-7 text-white sm:text-base">
          {title}
        </h3>

        <p className="mt-1 text-xs leading-6 text-white/40">
          {description}
        </p>
      </div>
    </article>
  );
}

function RequirementItem({
  icon,
  label,
  value,
}: {
  icon: "age" | "gender" | "city" | "briefcase" | "calendar" | "clock";
  label: string;
  value: string | number;
}) {
  return (
    <article className="group flex min-w-0 items-center gap-2.5 rounded-[1rem] border border-white/10 bg-black/20 p-3 transition duration-300 hover:border-gold/25 hover:bg-white/[0.025] sm:items-start sm:gap-4 sm:rounded-[1.5rem] sm:p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200 transition duration-300 group-hover:-translate-y-0.5 group-hover:border-emerald-300/25 group-hover:bg-emerald-300/[0.08] sm:h-11 sm:w-11">
        <OpportunityIcon name={icon} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
          {label}
        </p>

        <p className="mt-1 break-words text-[13px] font-light leading-5 text-white sm:mt-2 sm:text-base sm:leading-7">
          {value}
        </p>
      </div>
    </article>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group transition-colors duration-300 open:bg-white/[0.012]">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 p-4 text-start transition duration-300 hover:bg-white/[0.02] sm:gap-5 sm:p-6">
      <span className="text-sm font-light leading-6 text-white sm:text-base sm:leading-7">
          {question}
        </span>

        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-gold transition duration-300 group-open:rotate-180 group-open:border-gold/30 group-open:bg-gold/[0.06] sm:h-11 sm:w-11">
          <span className="absolute h-px w-3.5 bg-current" />
          <span className="absolute h-3.5 w-px bg-current transition-transform group-open:rotate-90 group-open:opacity-0" />
        </span>
      </summary>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <p className="max-w-3xl text-sm leading-8 text-white/45">
          {answer}
        </p>
      </div>
    </details>
  );
}

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="relative border-b border-e border-white/10 px-3 py-3 even:border-e-0 sm:p-6 sm:last:border-e-0 xl:border-b-0">
      <span className="inline-flex min-w-10 items-center text-base font-light tracking-[0.22em] text-gold/70 sm:text-lg">
  {number}
</span>

<h3 className="mt-2 text-sm font-light text-white sm:mt-5 sm:text-lg">
        {title}
      </h3>

      <p className="mt-2 hidden text-xs leading-6 text-white/40 sm:mt-3 sm:block sm:text-sm sm:leading-7">
        {description}
      </p>
    </article>
  );
}

function QuickFact({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon:
    | "city"
    | "calendar"
    | "clock"
    | "company"
    | "briefcase"
    | "wallet";
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-200"
      : tone === "warning"
        ? "text-amber-200"
        : tone === "danger"
          ? "text-red-200"
          : "text-white";

  return (
    <article className="min-w-0 border-b border-e border-white/10 bg-[#0b0b0b] px-3 py-3 even:border-e-0 sm:p-5 xl:p-6">
      <div className="flex items-center gap-3 sm:items-start">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.05] text-gold sm:h-10 sm:w-10 sm:rounded-xl">
          <OpportunityIcon name={icon} />
        </div>

        <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.16em] text-white/30 sm:text-[10px] sm:tracking-[0.18em]">
            {label}
          </p>

          <p
            className={`mt-1 break-words text-[13px] font-light leading-5 sm:mt-2 sm:text-base sm:leading-6 ${toneClass}`}
          >
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}
