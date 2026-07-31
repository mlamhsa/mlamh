import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ApplicationStatus =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected";

type OpportunityRecord = {
  id: number | string;
  title: string | null;
  slug: string | null;
  city_ar: string | null;
  city_en: string | null;
  opportunity_type: string | null;
  status: string | null;
  created_at: string | null;
};

type ApplicationRecord = {
  id: number | string;
  status: string | null;
  created_at: string | null;
  opportunity_id: number | string | null;
  talent_id: number | string | null;
  opportunities: OpportunityRecord | OpportunityRecord[] | null;
};

function normalizeStatus(status?: string | null): ApplicationStatus {
  if (
    status === "reviewing" ||
    status === "shortlisted" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    return status;
  }

  return "pending";
}

function statusLabel(status: ApplicationStatus, isArabic: boolean) {
  const labels: Record<ApplicationStatus, { ar: string; en: string }> = {
    pending: { ar: "جديد", en: "Pending" },
    reviewing: { ar: "قيد المراجعة", en: "Reviewing" },
    shortlisted: { ar: "القائمة المختصرة", en: "Shortlisted" },
    accepted: { ar: "مقبول", en: "Accepted" },
    rejected: { ar: "مرفوض", en: "Rejected" },
  };

  return isArabic ? labels[status].ar : labels[status].en;
}

function statusClass(status: ApplicationStatus) {
  const classes: Record<ApplicationStatus, string> = {
    pending: "border-amber-300/25 bg-amber-300/[0.08] text-amber-200",
    reviewing: "border-sky-300/25 bg-sky-300/[0.08] text-sky-200",
    shortlisted: "border-violet-300/25 bg-violet-300/[0.08] text-violet-200",
    accepted: "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200",
    rejected: "border-red-300/25 bg-red-300/[0.08] text-red-200",
  };

  return classes[status];
}

function statusDotClass(status: ApplicationStatus) {
  const classes: Record<ApplicationStatus, string> = {
    pending: "bg-amber-300",
    reviewing: "bg-sky-300",
    shortlisted: "bg-violet-300",
    accepted: "bg-emerald-300",
    rejected: "bg-red-300",
  };

  return classes[status];
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getOpportunityCity(
  opportunity: OpportunityRecord | null,
  locale: string
) {
  if (!opportunity) return "—";

  return locale === "ar"
    ? opportunity.city_ar || opportunity.city_en || "—"
    : opportunity.city_en || opportunity.city_ar || "—";
}

function getOpportunityTypeLabel(
  type: string | null | undefined,
  isArabic: boolean
) {
  if (!type) return isArabic ? "فرصة" : "Opportunity";

  const labels: Record<string, { ar: string; en: string }> = {
    commercial: { ar: "إعلان", en: "Commercial" },
    film: { ar: "فيلم", en: "Film" },
    series: { ar: "مسلسل", en: "Series" },
    theater: { ar: "مسرح", en: "Theater" },
    event: { ar: "فعالية", en: "Event" },
    modeling: { ar: "عرض أزياء", en: "Modeling" },
    voice_over: { ar: "تعليق صوتي", en: "Voice Over" },
    photography: { ar: "تصوير", en: "Photography" },
    content_creation: { ar: "صناعة محتوى", en: "Content Creation" },
  };

  if (labels[type]) {
    return isArabic ? labels[type].ar : labels[type].en;
  }

  return type.replaceAll("_", " ");
}

function getOpportunity(
  application: ApplicationRecord
): OpportunityRecord | null {
  if (Array.isArray(application.opportunities)) {
    return application.opportunities[0] ?? null;
  }

  return application.opportunities ?? null;
}

function DashboardIcon({
  name,
  className = "h-5 w-5",
}: {
  name: "all" | "pending" | "reviewing" | "accepted" | "rejected" | "arrow";
  className?: string;
}) {
  if (name === "all") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <path d="M8 7h11M8 12h11M8 17h11" strokeLinecap="round" />
        <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "pending") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.8v4.7l3 1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "reviewing") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4 4" strokeLinecap="round" />
        <path d="M8.2 10.5h4.6M10.5 8.2v4.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "accepted") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.2 12 2.5 2.5 5.3-5.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "rejected") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="m9 9 6 6M15 9l-6 6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function TalentRequestsPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, slug, name_ar, name_en")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[TalentRequestsPage talent] ${talentError.message}`);
  }

  if (!talent) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-background px-5 py-24 text-white"
      >
        <section className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 text-center shadow-2xl shadow-black/30 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.07] text-gold">
            <DashboardIcon name="all" className="h-6 w-6" />
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-gold">
            {isArabic ? "مساحة الموهبة" : "Talent Workspace"}
          </p>

          <h1 className="mt-3 text-3xl font-light sm:text-4xl">
            {isArabic ? "لم يتم العثور على ملف موهبة" : "Talent profile not found"}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/45">
            {isArabic
              ? "أكمل إنشاء ملف الموهبة أولًا، وبعدها ستتمكن من متابعة جميع طلباتك من هذه الصفحة."
              : "Complete your talent profile first, then you will be able to track every application from this page."}
          </p>

          <Link
            href={`/${locale}/join/talent`}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3 text-sm text-black transition hover:bg-gold-soft"
          >
            {isArabic ? "إكمال ملف الموهبة" : "Complete Talent Profile"}
            <DashboardIcon name="arrow" className="h-4 w-4" />
          </Link>
        </section>
      </main>
    );
  }

  const { data: applications, error: applicationsError } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunity_id,
      talent_id,
      opportunities (
        id,
        title,
        slug,
        city_ar,
        city_en,
        opportunity_type,
        status,
        created_at
      )
    `
    )
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    throw new Error(
      `[TalentRequestsPage applications] ${applicationsError.message}`
    );
  }

  const allApplications = (applications ?? []) as ApplicationRecord[];

  const counts = allApplications.reduce(
    (result, application) => {
      const status = normalizeStatus(application.status);

      result.total += 1;
      result[status] += 1;

      return result;
    },
    {
      total: 0,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
    }
  );

  const statCards = [
    {
      key: "total",
      label: isArabic ? "كل الطلبات" : "All Applications",
      value: counts.total,
      icon: "all" as const,
      className: "border-gold/25 bg-gold/[0.06]",
      iconClassName: "border-gold/30 bg-gold/[0.08] text-gold",
    },
    {
      key: "pending",
      label: isArabic ? "جديد" : "Pending",
      value: counts.pending,
      icon: "pending" as const,
      className: "border-white/10 bg-white/[0.025]",
      iconClassName: "border-amber-300/20 bg-amber-300/[0.06] text-amber-200",
    },
    {
      key: "reviewing",
      label: isArabic ? "قيد المراجعة" : "Reviewing",
      value: counts.reviewing,
      icon: "reviewing" as const,
      className: "border-white/10 bg-white/[0.025]",
      iconClassName: "border-sky-300/20 bg-sky-300/[0.06] text-sky-200",
    },
    {
      key: "shortlisted",
      label: isArabic ? "القائمة المختصرة" : "Shortlisted",
      value: counts.shortlisted,
      icon: "reviewing" as const,
      className: "border-white/10 bg-white/[0.025]",
      iconClassName: "border-violet-300/20 bg-violet-300/[0.06] text-violet-200",
    },
    {
      key: "accepted",
      label: isArabic ? "مقبول" : "Accepted",
      value: counts.accepted,
      icon: "accepted" as const,
      className: "border-white/10 bg-white/[0.025]",
      iconClassName: "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200",
    },
    {
      key: "rejected",
      label: isArabic ? "مرفوض" : "Rejected",
      value: counts.rejected,
      icon: "rejected" as const,
      className: "border-white/10 bg-white/[0.025]",
      iconClassName: "border-red-300/20 bg-red-300/[0.06] text-red-200",
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/${locale}/talent-dashboard`}
                className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
              >
                <span className={isArabic ? "rotate-180" : ""}>
                  <DashboardIcon name="arrow" className="h-4 w-4" />
                </span>
                {isArabic ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
              </Link>

              <p className="mt-8 text-[10px] uppercase tracking-[0.36em] text-gold">
                {isArabic ? "لوحة الموهبة" : "Talent Workspace"}
              </p>

              <h1 className="mt-3 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
                {isArabic ? "طلباتي" : "My Applications"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
                {isArabic
                  ? "تابع حالة الفرص التي تقدمت عليها، واعرف انتقال كل طلب من المراجعة إلى القبول أو الرفض."
                  : "Track the opportunities you applied to and follow every application from review to acceptance or rejection."}
              </p>
            </div>

            <Link
              href={`/${locale}/opportunities`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3.5 text-sm text-black transition hover:bg-gold-soft sm:w-auto"
            >
              {isArabic ? "استعراض الفرص" : "Browse Opportunities"}
              <DashboardIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((card) => (
            <article
              key={card.key}
              className={`min-w-0 rounded-[1.5rem] border p-4 transition hover:-translate-y-0.5 hover:border-gold/25 sm:p-5 ${card.className}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.iconClassName}`}
              >
                <DashboardIcon name={card.icon} />
              </div>

              <p className="mt-5 truncate text-[10px] uppercase tracking-[0.18em] text-white/40">
                {card.label}
              </p>

              <p className="mt-2 text-3xl font-light sm:text-4xl">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isArabic ? "سجل الطلبات" : "Application History"}
              </p>

              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isArabic ? "الفرص التي تقدمت عليها" : "Your Submitted Applications"}
              </h2>
            </div>

            <p className="text-xs text-white/35">
              {isArabic
                ? `${counts.total} طلب`
                : `${counts.total} application${counts.total === 1 ? "" : "s"}`}
            </p>
          </div>

          {allApplications.length > 0 ? (
            <div className="space-y-3">
              {allApplications.map((application) => {
                const opportunity = getOpportunity(application);
                const normalizedStatus = normalizeStatus(application.status);
                const opportunityHref = opportunity?.slug
                  ? `/${locale}/opportunities/${opportunity.slug}`
                  : `/${locale}/opportunities`;

                return (
                  <article
                    key={application.id}
                    className="group rounded-[1.5rem] border border-white/10 bg-black/25 p-4 transition hover:border-gold/25 hover:bg-white/[0.03] sm:p-5"
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_0.75fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/45">
                            {getOpportunityTypeLabel(
                              opportunity?.opportunity_type,
                              isArabic
                            )}
                          </span>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${statusClass(
                              normalizedStatus
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusDotClass(
                                normalizedStatus
                              )}`}
                            />
                            {statusLabel(normalizedStatus, isArabic)}
                          </span>
                        </div>

                        <h3 className="mt-3 truncate text-xl font-light sm:text-2xl">
                          {opportunity?.title ||
                            (isArabic ? "فرصة بدون عنوان" : "Untitled Opportunity")}
                        </h3>
                      </div>

                      <InfoItem
                        label={isArabic ? "المدينة" : "City"}
                        value={getOpportunityCity(opportunity, locale)}
                      />

                      <InfoItem
                        label={isArabic ? "الحالة" : "Status"}
                        value={statusLabel(normalizedStatus, isArabic)}
                      />

                      <InfoItem
                        label={isArabic ? "تاريخ التقديم" : "Applied"}
                        value={formatDate(application.created_at, locale)}
                      />

                      <Link
                        href={opportunityHref}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        {isArabic ? "عرض الفرصة" : "View Opportunity"}
                        <DashboardIcon name="arrow" className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 px-5 py-12 text-center sm:px-8 sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                <DashboardIcon name="all" className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-2xl font-light">
                {isArabic ? "لم تتقدم على أي فرصة بعد" : "No applications yet"}
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                {isArabic
                  ? "ابدأ باستعراض الفرص المتاحة، واختر ما يناسب خبرتك واهتماماتك."
                  : "Browse the available opportunities and apply to the ones that match your experience and interests."}
              </p>

              <Link
                href={`/${locale}/opportunities`}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3 text-sm text-black transition hover:bg-gold-soft"
              >
                {isArabic ? "استعراض الفرص" : "Browse Opportunities"}
                <DashboardIcon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 lg:border-0 lg:bg-transparent lg:px-0">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">
        {label}
      </p>
      <p className="mt-1 truncate text-sm text-white/65">{value}</p>
    </div>
  );
}
