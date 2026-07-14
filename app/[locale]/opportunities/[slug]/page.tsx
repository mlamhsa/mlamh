import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import OpportunityShareButton from "@/components/opportunities/OpportunityShareButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";

type OpportunityPageProps = {
  params: Promise<{ locale?: string; slug: string }>;
};

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected";

async function applyToOpportunity(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const opportunityId = Number(formData.get("opportunityId"));

  if (!Number.isFinite(opportunityId) || opportunityId <= 0) {
    throw new Error("[applyToOpportunity] Invalid opportunity id.");
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/talent-login`);
  }

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[applyToOpportunity talent] ${talentError.message}`);
  }

  if (!talent) {
    redirect(`/${locale}/talent-dashboard/profile`);
  }

  const { data: existingApplication, error: existingApplicationError } =
    await adminClient
      .from("opportunity_applications")
      .select("id")
      .eq("opportunity_id", opportunityId)
      .eq("talent_id", talent.id)
      .maybeSingle();

  if (existingApplicationError) {
    throw new Error(
      `[applyToOpportunity existing application] ${existingApplicationError.message}`
    );
  }

  if (!existingApplication) {
    const { error: insertError } = await adminClient
      .from("opportunity_applications")
      .insert({
        opportunity_id: opportunityId,
        talent_id: talent.id,
        status: "pending",
      });

    if (insertError) {
      throw new Error(`[applyToOpportunity insert] ${insertError.message}`);
    }
  }

  revalidatePath(`/${locale}/opportunities`);
  revalidatePath(`/${locale}/talent-dashboard/applications`);
  revalidatePath(`/${locale}/talent-dashboard/notifications`);

  redirect(`/${locale}/talent-dashboard/applications`);
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

function formatBudget(value: unknown, isRtl: boolean) {
  const budget = Number(value);

  if (!budget) return isRtl ? "حسب الاتفاق" : "By agreement";

  return `${new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US").format(budget)} ${
    isRtl ? "ريال" : "SAR"
  }`;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getOptionalString(
  record: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getOpportunityTypeLabel(value: unknown, isRtl: boolean) {
  const type = String(value ?? "");

  const labels: Record<string, { ar: string; en: string }> = {
    actor: { ar: "ممثل", en: "Actor" },
    actress: { ar: "ممثلة", en: "Actress" },
    model: { ar: "عارض أزياء", en: "Model" },
    presenter: { ar: "مقدم", en: "Presenter" },
    voice_actor: { ar: "ممثل صوتي", en: "Voice Actor" },
    singer: { ar: "مغنٍ", en: "Singer" },
    dancer: { ar: "راقص", en: "Dancer" },
    athlete: { ar: "رياضي", en: "Athlete" },
    extra: { ar: "كومبارس", en: "Extra" },
    influencer: { ar: "صانع محتوى", en: "Influencer" },
    content_creator: { ar: "صانع محتوى", en: "Content Creator" },
    makeup_artist: { ar: "خبير تجميل", en: "Makeup Artist" },
    photographer: { ar: "مصور", en: "Photographer" },
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

export default async function OpportunityDetailPage({
  params,
}: OpportunityPageProps) {
  const { locale = "ar", slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const isRtl = locale === "ar";

  const opportunities = await getPublishedOpportunities();

  const opportunity =
    opportunities.find(
      (item: any) => item.slug === slug || String(item.id) === slug
    ) || null;

  if (!opportunity) {
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-5 py-24 text-white"
      >
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 text-center sm:p-10">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
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

  const { data: talent, error: talentError } = user
    ? await adminClient
        .from("talents")
        .select("id")
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

  const canApply = Boolean(user && talent && !existingApplication && isOpen);

  const city = isRtl
    ? opportunity.city_ar || opportunity.city_en || "—"
    : opportunity.city_en || opportunity.city_ar || "—";

  const budget = formatBudget(opportunity.budget, isRtl);
  const opportunityType = getOpportunityTypeLabel(
    opportunity.opportunity_type,
    isRtl
  );
  const gender = getGenderLabel(opportunity.required_gender, isRtl);
  const companyName =
    getOptionalString(
      opportunity as unknown as Record<string, unknown>,
      "company_name",
      "publisher_name",
      "company"
    ) || (isRtl ? "جهة غير محددة" : "Publisher not specified");

  const publishedDate = formatDate(opportunity.created_at, locale);

  const deadline = formatDate(
    getOptionalString(
      opportunity as unknown as Record<string, unknown>,
      "deadline",
      "application_deadline"
    ),
    locale
  );

  const contactName =
    getOptionalString(
      opportunity as unknown as Record<string, unknown>,
      "contact_name"
    ) || "—";

  const contactPhone =
    getOptionalString(
      opportunity as unknown as Record<string, unknown>,
      "contact_phone"
    ) || "—";

  const contactEmail =
    getOptionalString(
      opportunity as unknown as Record<string, unknown>,
      "contact_email"
    ) || "—";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-32 pt-36 text-white sm:px-6 sm:pt-40 lg:pb-24 lg:pt-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/opportunities`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/35 hover:text-gold"
          >
            <span className={isRtl ? "rotate-180" : ""}>
              <OpportunityIcon name="arrow" className="h-4 w-4" />
            </span>
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
          </Link>

          <OpportunityShareButton
            title={opportunity.title || (isRtl ? "فرصة من ملامح" : "MLAMH Opportunity")}
          />
        </div>

        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.01))] p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-gold">
                  {opportunityType}
                </span>

                <span
                  className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] ${
                    isOpen
                      ? "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200"
                      : "border-red-300/25 bg-red-300/[0.07] text-red-200"
                  }`}
                >
                  {isOpen
                    ? isRtl
                      ? "متاحة للتقديم"
                      : "Open for Applications"
                    : isRtl
                      ? "مغلقة"
                      : "Closed"}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
                {opportunity.title ||
                  (isRtl ? "فرصة بدون عنوان" : "Untitled Opportunity")}
              </h1>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/45">
                <span className="inline-flex items-center gap-2">
                  <OpportunityIcon name="company" className="h-4 w-4 text-gold" />
                  {companyName}
                </span>
                <span className="inline-flex items-center gap-2">
                  <OpportunityIcon name="city" className="h-4 w-4 text-gold" />
                  {city}
                </span>
                <span className="inline-flex items-center gap-2">
                  <OpportunityIcon name="calendar" className="h-4 w-4 text-gold" />
                  {publishedDate}
                </span>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-8 text-white/50 sm:text-base">
                {opportunity.description ||
                  (isRtl
                    ? "لا يوجد وصف متاح لهذه الفرصة."
                    : "No description is available for this opportunity.")}
              </p>
            </div>

            <div className="w-full lg:w-[330px]">
              <ApplyArea
                locale={locale}
                isRtl={isRtl}
                isOpen={isOpen}
                canApply={canApply}
                existingApplication={existingApplication}
                opportunityId={Number(opportunity.id)}
              />
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 lg:p-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
              </p>

              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isRtl ? "المعلومات الأساسية" : "Key Information"}
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoCard
                  icon="city"
                  label={isRtl ? "المدينة" : "City"}
                  value={city}
                />
                <InfoCard
                  icon="wallet"
                  label={isRtl ? "الميزانية" : "Budget"}
                  value={budget}
                />
                <InfoCard
                  icon="age"
                  label={isRtl ? "العمر المطلوب" : "Required Age"}
                  value={
                    opportunity.min_age || opportunity.max_age
                      ? `${opportunity.min_age ?? "—"} - ${
                          opportunity.max_age ?? "—"
                        }`
                      : isRtl
                        ? "غير محدد"
                        : "Not specified"
                  }
                />
                <InfoCard
                  icon="gender"
                  label={isRtl ? "الجنس المطلوب" : "Required Gender"}
                  value={gender}
                />
                <InfoCard
                  icon="calendar"
                  label={isRtl ? "آخر موعد للتقديم" : "Application Deadline"}
                  value={deadline}
                />
                <InfoCard
                  icon="briefcase"
                  label={isRtl ? "نوع الفرصة" : "Opportunity Type"}
                  value={opportunityType}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6 lg:p-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isRtl ? "حول الفرصة" : "About the Opportunity"}
              </p>

              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isRtl ? "الوصف الكامل" : "Full Description"}
              </h2>

              <p className="mt-6 whitespace-pre-line text-sm leading-8 text-white/55 sm:text-base">
                {opportunity.description ||
                  (isRtl
                    ? "لا يوجد وصف متاح لهذه الفرصة."
                    : "No description is available for this opportunity.")}
              </p>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_45%),rgba(201,169,98,0.035)] p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isRtl ? "حالة التقديم" : "Application Status"}
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
                        isRtl
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
                  <p className="text-sm leading-7 text-white/45">
                    {isRtl
                      ? "بعد التقديم ستظهر حالة طلبك هنا وفي صفحة طلباتي."
                      : "After applying, your status will appear here and in My Applications."}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isRtl ? "جهة العرض" : "Publisher"}
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                  <OpportunityIcon name="company" className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-light">{companyName}</p>
                  <p className="mt-1 text-xs text-white/35">
                    {isRtl ? "الجهة الناشرة للفرصة" : "Opportunity Publisher"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm">
                <InfoLine
                  label={isRtl ? "مسؤول التواصل" : "Contact"}
                  value={contactName}
                />
                <InfoLine
                  label={isRtl ? "الهاتف" : "Phone"}
                  value={contactPhone}
                />
                <InfoLine
                  label={isRtl ? "البريد" : "Email"}
                  value={contactEmail}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-black/95 p-4 backdrop-blur-xl lg:hidden">
        <ApplyArea
          locale={locale}
          isRtl={isRtl}
          isOpen={isOpen}
          canApply={canApply}
          existingApplication={existingApplication}
          opportunityId={Number(opportunity.id)}
          compact
        />
      </div>
    </main>
  );
}

function ApplyArea({
  locale,
  isRtl,
  isOpen,
  canApply,
  existingApplication,
  opportunityId,
  compact = false,
}: {
  locale: string;
  isRtl: boolean;
  isOpen: boolean;
  canApply: boolean;
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
      <form action={applyToOpportunity}>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="opportunityId" value={opportunityId} />

        <button
          type="submit"
          className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-sm font-medium text-black transition hover:bg-gold-soft ${
            compact ? "min-h-12" : "min-h-14"
          }`}
        >
          <OpportunityIcon name="briefcase" />
          {isRtl ? "التقديم على الفرصة" : "Apply for Opportunity"}
        </button>
      </form>
    );
  }

  return (
    <Link
      href={`/${locale}/talent-login`}
      className={`inline-flex w-full items-center justify-center rounded-2xl border border-gold/40 px-6 text-center text-sm font-medium text-gold transition hover:bg-gold hover:text-black ${
        compact ? "min-h-12" : "min-h-14"
      }`}
    >
      {isRtl ? "سجّل الدخول كموهبة للتقديم" : "Login as Talent to Apply"}
    </Link>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: "city" | "wallet" | "age" | "gender" | "calendar" | "briefcase";
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition hover:border-gold/20 sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
        <OpportunityIcon name={icon} />
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-light text-white sm:text-lg">
        {value}
      </p>
    </article>
  );
}

function InfoLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="shrink-0 text-white/35">{label}</span>
      <span className="break-all text-end text-white/65">{value}</span>
    </div>
  );
}
