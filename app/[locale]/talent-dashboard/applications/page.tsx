import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Inbox,
  ListChecks,
  XCircle,
} from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

type DisplayStatus = "pending" | "reviewing" | "accepted" | "rejected";
type FilterStatus = "all" | DisplayStatus;

type OpportunityRecord = {
  id: number | string;
  title: string | null;
  slug: string | null;
  city_ar: string | null;
  city_en: string | null;
  opportunity_type: string | null;
  posting_mode: string | null;
};

type ApplicationRecord = {
  id: number | string;
  status: string | null;
  created_at: string | null;
  opportunity_id: number | string | null;
  opportunities: OpportunityRecord | OpportunityRecord[] | null;
};

function normalizeDisplayStatus(status?: string | null): DisplayStatus {
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "rejected";
  if (status === "reviewing" || status === "shortlisted") return "reviewing";
  return "pending";
}

function getOpportunity(application: ApplicationRecord): OpportunityRecord | null {
  return Array.isArray(application.opportunities)
    ? application.opportunities[0] ?? null
    : application.opportunities ?? null;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function opportunityTypeLabel(value: string | null | undefined, isArabic: boolean) {
  const key = String(value ?? "").trim().toLowerCase().replaceAll("-", "_");
  const labels: Record<string, { ar: string; en: string }> = {
    actor: { ar: "ممثل / ممثلة", en: "Actor" },
    model: { ar: "مودل", en: "Model" },
  };

  if (!key) return isArabic ? "فرصة" : "Opportunity";
  return labels[key]?.[isArabic ? "ar" : "en"] ?? key.replaceAll("_", " ");
}

function cityLabel(opportunity: OpportunityRecord | null, locale: string) {
  if (!opportunity) return "—";
  return locale === "ar"
    ? opportunity.city_ar || opportunity.city_en || "—"
    : opportunity.city_en || opportunity.city_ar || "—";
}

function displayStatusLabel(
  status: DisplayStatus,
  isQuickRequest: boolean,
  isArabic: boolean,
) {
  if (isQuickRequest) {
    if (status === "pending") return isArabic ? "مهتم" : "Interested";
    if (status === "reviewing") return isArabic ? "قيد المراجعة" : "In review";
    if (status === "accepted") return isArabic ? "اختيار مبدئي" : "Preliminary selection";
    return isArabic ? "تم الاعتذار" : "Not selected";
  }

  if (status === "pending") return isArabic ? "تم الاستلام" : "Received";
  if (status === "reviewing") return isArabic ? "قيد المراجعة" : "In review";
  if (status === "accepted") return isArabic ? "مقبول" : "Accepted";
  return isArabic ? "مرفوض" : "Rejected";
}

function statusClasses(status: DisplayStatus) {
  if (status === "accepted") return "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-200";
  if (status === "rejected") return "border-red-300/25 bg-red-300/[0.08] text-red-200";
  if (status === "reviewing") return "border-sky-300/25 bg-sky-300/[0.08] text-sky-200";
  return "border-amber-300/25 bg-amber-300/[0.08] text-amber-200";
}

function buildFilterHref(locale: string, status: FilterStatus) {
  return status === "all"
    ? `/${locale}/talent-dashboard/applications`
    : `/${locale}/talent-dashboard/applications?status=${status}`;
}

export default async function TalentApplicationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { status: rawStatus } = await searchParams;
  const isArabic = locale === "ar";
  const statusFilter: FilterStatus =
    rawStatus === "pending" ||
    rawStatus === "reviewing" ||
    rawStatus === "accepted" ||
    rawStatus === "rejected"
      ? rawStatus
      : "all";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

  const adminClient = createAdminClient();
  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) throw new Error(`[TalentApplicationsPage talent] ${talentError.message}`);
  if (!talent) redirect(`/${locale}/join/talent`);

  const { data: applicationsData, error: applicationsError } = await adminClient
    .from("opportunity_applications")
    .select(`
      id,
      status,
      created_at,
      opportunity_id,
      opportunities (
        id,
        title,
        slug,
        city_ar,
        city_en,
        opportunity_type,
        posting_mode
      )
    `)
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  if (applicationsError) {
    throw new Error(`[TalentApplicationsPage applications] ${applicationsError.message}`);
  }

  const applications = (applicationsData ?? []) as ApplicationRecord[];
  const applicationIds = applications.map((application) => application.id);
  const conversationByApplication = new Map<string, string>();

  if (applicationIds.length > 0) {
    const { data: conversations, error: conversationsError } = await adminClient
      .from("conversations")
      .select("id, application_id")
      .in("application_id", applicationIds);

    if (conversationsError) {
      console.error("[TalentApplicationsPage conversations]", conversationsError);
    } else {
      for (const conversation of conversations ?? []) {
        if (conversation.application_id !== null && conversation.application_id !== undefined) {
          conversationByApplication.set(String(conversation.application_id), String(conversation.id));
        }
      }
    }
  }

  const counts = applications.reduce(
    (result, application) => {
      const normalized = normalizeDisplayStatus(application.status);
      result.total += 1;
      result[normalized] += 1;
      return result;
    },
    { total: 0, pending: 0, reviewing: 0, accepted: 0, rejected: 0 },
  );

  const visibleApplications =
    statusFilter === "all"
      ? applications
      : applications.filter(
          (application) => normalizeDisplayStatus(application.status) === statusFilter,
        );

  const filterCards = [
    {
      key: "all" as const,
      label: isArabic ? "كل الطلبات" : "All",
      value: counts.total,
      icon: ListChecks,
    },
    {
      key: "pending" as const,
      label: isArabic ? "جديد / مهتم" : "New / Interested",
      value: counts.pending,
      icon: Inbox,
    },
    {
      key: "reviewing" as const,
      label: isArabic ? "قيد المراجعة" : "In review",
      value: counts.reviewing,
      icon: Clock3,
    },
    {
      key: "accepted" as const,
      label: isArabic ? "اختيار / قبول" : "Selected / Accepted",
      value: counts.accepted,
      icon: CheckCircle2,
    },
    {
      key: "rejected" as const,
      label: isArabic ? "اعتذار / رفض" : "Not selected / Rejected",
      value: counts.rejected,
      icon: XCircle,
    },
  ];

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8 lg:p-10">
          <Link
            href={`/${locale}/talent-dashboard`}
            className="text-xs text-white/45 transition hover:text-gold"
          >
            {isArabic ? "العودة إلى لوحة الموهبة" : "Back to dashboard"}
          </Link>

          <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold">
                {isArabic ? "نشاطي" : "MY ACTIVITY"}
              </p>
              <h1 className="mt-3 text-4xl font-light sm:text-5xl">
                {isArabic ? "طلباتي" : "My Applications"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                {isArabic
                  ? "تابع اهتمامك بالطلبات السريعة وتقديماتك على فرص الكاستينغ. نعرض لك الحالة بصياغة تناسب نوع الفرصة."
                  : "Track Quick Request interests and Casting applications with status wording that matches each workflow."}
              </p>
            </div>

            <Link
              href={`/${locale}/opportunities`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-black transition hover:bg-gold-soft"
            >
              {isArabic ? "استعراض الفرص" : "Browse opportunities"}
              <ArrowUpRight size={16} className={isArabic ? "-scale-x-100" : undefined} />
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {filterCards.map((card) => {
            const Icon = card.icon;
            const active = statusFilter === card.key;
            return (
              <Link
                key={card.key}
                href={buildFilterHref(locale, card.key)}
                aria-current={active ? "page" : undefined}
                className={`rounded-[1.5rem] border p-4 transition sm:p-5 ${
                  active
                    ? "border-gold/35 bg-gold/[0.07]"
                    : "border-white/10 bg-white/[0.025] hover:border-gold/25"
                }`}
              >
                <Icon size={19} className={active ? "text-gold" : "text-white/35"} />
                <p className="mt-4 text-xs text-white/45">{card.label}</p>
                <strong className="mt-2 block text-3xl font-light text-white">{card.value}</strong>
              </Link>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isArabic ? "سجل الطلبات" : "APPLICATION HISTORY"}
              </p>
              <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                {isArabic ? "الفرص التي تفاعلت معها" : "Your opportunity activity"}
              </h2>
            </div>
            <span className="shrink-0 text-xs text-white/35">
              {isArabic
                ? `${visibleApplications.length} طلب`
                : `${visibleApplications.length} application${visibleApplications.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {visibleApplications.length > 0 ? (
            <div className="space-y-3">
              {visibleApplications.map((application) => {
                const opportunity = getOpportunity(application);
                const normalizedStatus = normalizeDisplayStatus(application.status);
                const quick = opportunity?.posting_mode === "quick";
                const statusLabel = displayStatusLabel(normalizedStatus, quick, isArabic);
                const conversationId = conversationByApplication.get(String(application.id));
                const canOpenConversation = Boolean(conversationId) &&
                  (quick || normalizedStatus === "accepted");
                const opportunityHref = opportunity?.slug
                  ? `/${locale}/opportunities/${opportunity.slug}`
                  : `/${locale}/opportunities`;

                return (
                  <article
                    key={application.id}
                    className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4 transition hover:border-gold/25 sm:p-5"
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_0.7fr_0.8fr_0.8fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] text-white/45">
                            {quick
                              ? isArabic ? "طلب سريع" : "Quick Request"
                              : opportunityTypeLabel(opportunity?.opportunity_type, isArabic)}
                          </span>
                          <span className={`rounded-full border px-3 py-1 text-[10px] ${statusClasses(normalizedStatus)}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <h3 className="mt-3 truncate text-xl font-light sm:text-2xl">
                          {opportunity?.title || (isArabic ? "فرصة بدون عنوان" : "Untitled opportunity")}
                        </h3>
                      </div>

                      <InfoItem label={isArabic ? "المدينة" : "City"} value={cityLabel(opportunity, locale)} />
                      <InfoItem label={isArabic ? "الحالة" : "Status"} value={statusLabel} />
                      <InfoItem label={isArabic ? "تاريخ التقديم" : "Applied"} value={formatDate(application.created_at, locale)} />

                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <Link
                          href={opportunityHref}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/40 hover:text-gold"
                        >
                          {isArabic ? "عرض الفرصة" : "View opportunity"}
                        </Link>
                        {canOpenConversation && conversationId ? (
                          <Link
                            href={`/${locale}/talent-dashboard/messages/${conversationId}`}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold/35 bg-gold/[0.07] px-4 text-xs text-gold transition hover:bg-gold hover:text-black"
                          >
                            {isArabic ? "فتح المحادثة" : "Open conversation"}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 px-5 py-14 text-center">
              <Inbox className="mx-auto text-gold" size={28} />
              <h3 className="mt-5 text-2xl font-light">
                {statusFilter === "all"
                  ? isArabic ? "لم تتقدم على أي فرصة بعد" : "No applications yet"
                  : isArabic ? "لا توجد طلبات بهذه الحالة" : "No applications with this status"}
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                {isArabic
                  ? "استعرض الفرص المناسبة لك وابدأ عندما تجد فرصة تناسب ملفك."
                  : "Browse relevant opportunities and apply when you find a good fit."}
              </p>
              <Link
                href={`/${locale}/opportunities`}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-semibold text-black"
              >
                {isArabic ? "استعراض الفرص" : "Browse opportunities"}
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
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/30">{label}</p>
      <p className="mt-1 truncate text-sm text-white/65">{value}</p>
    </div>
  );
}
