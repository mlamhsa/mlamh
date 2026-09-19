import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CircleAlert,
  FileClock,
  History,
  Megaphone,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";

import { AdminTalentAnalytics } from "@/components/admin/AdminTalentAnalytics";
import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage, type AdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { userHasPermission } from "@/lib/rbac/helpers";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { TalentService } from "@/lib/services/talents/TalentService";
import { PublisherService } from "@/lib/services/publishers/PublisherService";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

type EventMetadata = Record<string, unknown>;

type ResubmittedOpportunity = {
  id: number;
  title: string;
  publisher_id: number | null;
  updated_at: string | null;
  status: string | null;
};

function withLanguage(href: string, language: AdminLanguage) {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}lang=${language}`;
}

function getMetadataObject(value: unknown): EventMetadata {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as EventMetadata)
    : {};
}

function getMetadataNumber(metadata: EventMetadata, key: string) {
  const value = metadata[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function formatDateTime(
  value: string | null | undefined,
  language: AdminLanguage,
) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(
    language === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ).format(date);
}

export default async function AdminPage({ searchParams }: PageProps) {
  const currentAdmin = await requireAdminAccess();

  let canViewAdminAccess = false;

  try {
    canViewAdminAccess = await userHasPermission(
      currentAdmin.id,
      PERMISSIONS.ADMINS_VIEW,
    );
  } catch (permissionError) {
    console.error("[AdminDashboard access permission]", permissionError);
  }

  const resolvedSearchParams = await searchParams;
  const language = getAdminLanguage(resolvedSearchParams.lang);
  const isArabic = language === "ar";
  const adminClient = createAdminClient();

  const [
    talentStats,
    topViewedTalents,
    pendingTalentChangesResult,
    pendingTalentsResult,
    pendingPublishersData,
    pendingPublisherVerificationsResult,
    pendingOpportunitiesResult,
    reportedMessagesResult,
    publishersTotalResult,
    opportunitiesTotalResult,
    publishedOpportunitiesResult,
    applicationsTotalResult,
    resubmittedEventsResult,
  ] = await Promise.all([
    TalentService.getAdminStats(),
    TalentService.getTopViewed(5),
    adminClient
      .from("talent_profile_change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "talent")
      .eq("approval_status", "pending"),
    PublisherService.getAll(),
    adminClient
      .from("publishers")
      .select("id", { count: "exact", head: true })
      .neq("publisher_type", "individual")
      .eq("verification_status", "pending"),
    adminClient
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review"),
    adminClient
      .from("messages")
      .select("id", { count: "exact", head: true })
      .not("reported_at", "is", null)
      .is("report_reviewed_at", null),
    adminClient
      .from("publishers")
      .select("id", { count: "exact", head: true }),
    adminClient
      .from("opportunities")
      .select("id", { count: "exact", head: true }),
    adminClient
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    adminClient
      .from("opportunity_applications")
      .select("id", { count: "exact", head: true }),
    adminClient
      .from("events")
      .select("id, metadata, created_at")
      .eq("event_type", "opportunity_pending_review")
      .contains("metadata", { reason: "resubmitted_after_changes" })
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const logError = (label: string, error: unknown) => {
    if (error) console.error(`[AdminDashboard ${label}]`, error);
  };

  logError("pendingTalentChanges", pendingTalentChangesResult.error);
  logError("pendingTalents", pendingTalentsResult.error);
  logError(
    "pendingPublisherVerifications",
    pendingPublisherVerificationsResult.error,
  );
  logError("pendingOpportunities", pendingOpportunitiesResult.error);
  logError("reportedMessages", reportedMessagesResult.error);
  logError("publishersTotal", publishersTotalResult.error);
  logError("opportunitiesTotal", opportunitiesTotalResult.error);
  logError("publishedOpportunities", publishedOpportunitiesResult.error);
  logError("applicationsTotal", applicationsTotalResult.error);
  logError("resubmittedEvents", resubmittedEventsResult.error);

  const pendingTalentChanges = pendingTalentChangesResult.error
    ? 0
    : pendingTalentChangesResult.count ?? 0;
  const pendingTalents = pendingTalentsResult.error
    ? 0
    : pendingTalentsResult.count ?? 0;
  const pendingPublishers = pendingPublishersData.filter(
    (publisher) => publisher.approval_status === "pending",
  ).length;
  const pendingPublisherVerifications = pendingPublisherVerificationsResult.error
    ? 0
    : pendingPublisherVerificationsResult.count ?? 0;
  const pendingOpportunities = pendingOpportunitiesResult.error
    ? 0
    : pendingOpportunitiesResult.count ?? 0;
  const reportedMessages = reportedMessagesResult.error
    ? 0
    : reportedMessagesResult.count ?? 0;

  const publishersTotal = publishersTotalResult.error
    ? 0
    : publishersTotalResult.count ?? 0;
  const opportunitiesTotal = opportunitiesTotalResult.error
    ? 0
    : opportunitiesTotalResult.count ?? 0;
  const publishedOpportunities = publishedOpportunitiesResult.error
    ? 0
    : publishedOpportunitiesResult.count ?? 0;
  const applicationsTotal = applicationsTotalResult.error
    ? 0
    : applicationsTotalResult.count ?? 0;

  const resubmittedEvents = resubmittedEventsResult.data ?? [];
  const resubmittedOpportunityIds = Array.from(
    new Set(
      resubmittedEvents
        .map((event) =>
          getMetadataNumber(getMetadataObject(event.metadata), "opportunityId"),
        )
        .filter(
          (opportunityId): opportunityId is number =>
            typeof opportunityId === "number",
        ),
    ),
  );

  let resubmittedOpportunities: ResubmittedOpportunity[] = [];

  if (resubmittedOpportunityIds.length > 0) {
    const { data, error } = await adminClient
      .from("opportunities")
      .select("id, title, publisher_id, updated_at, status")
      .in("id", resubmittedOpportunityIds)
      .eq("status", "pending_review");

    if (error) {
      console.error("[AdminDashboard resubmittedOpportunities]", error);
    } else {
      resubmittedOpportunities = (data ?? []) as ResubmittedOpportunity[];
    }
  }

  const opportunitiesById = new Map(
    resubmittedOpportunities.map((opportunity) => [opportunity.id, opportunity]),
  );

  const recentResubmissions = resubmittedEvents
    .map((event) => {
      const opportunityId = getMetadataNumber(
        getMetadataObject(event.metadata),
        "opportunityId",
      );

      if (!opportunityId) return null;

      const opportunity = opportunitiesById.get(opportunityId);
      if (!opportunity) return null;

      return {
        eventId: event.id,
        opportunityId,
        title: opportunity.title,
        createdAt: event.created_at ?? null,
      };
    })
    .filter(
      (
        item,
      ): item is {
        eventId: number;
        opportunityId: number;
        title: string;
        createdAt: string | null;
      } => item !== null,
    );

  const totalActionRequired =
    pendingTalents +
    pendingTalentChanges +
    pendingPublishers +
    pendingPublisherVerifications +
    pendingOpportunities +
    reportedMessages;

  const actionItems = [
    {
      labelAr: "مواهب للمراجعة",
      labelEn: "Talent reviews",
      value: pendingTalents,
      href: "/admin/talents?review=pending",
      icon: Users,
    },
    {
      labelAr: "تعديلات ملفات",
      labelEn: "Profile changes",
      value: pendingTalentChanges,
      href: "/admin/action-center",
      icon: FileClock,
    },
    {
      labelAr: "اعتماد ناشرين",
      labelEn: "Publisher approvals",
      value: pendingPublishers,
      href: "/admin/publishers",
      icon: Building2,
    },
    {
      labelAr: "توثيق جهات",
      labelEn: "Publisher verification",
      value: pendingPublisherVerifications,
      href: "/admin/publishers",
      icon: ShieldCheck,
    },
    {
      labelAr: "فرص للمراجعة",
      labelEn: "Opportunity reviews",
      value: pendingOpportunities,
      href: "/admin/opportunities?status=pending_review",
      icon: BriefcaseBusiness,
    },
    {
      labelAr: "بلاغات محادثات",
      labelEn: "Conversation reports",
      value: reportedMessages,
      href: "/admin/messages",
      icon: CircleAlert,
    },
  ];

  const quickLinks = [
    {
      labelAr: "إدارة المواهب",
      labelEn: "Manage talents",
      descriptionAr: "الملفات، الاعتماد وجودة البيانات",
      descriptionEn: "Profiles, reviews and data quality",
      href: "/admin/talents",
      icon: Users,
    },
    {
      labelAr: "إدارة الفرص",
      labelEn: "Manage opportunities",
      descriptionAr: "إنشاء، مراجعة ونشر الفرص",
      descriptionEn: "Create, review and publish opportunities",
      href: "/admin/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      labelAr: "ذكاء ملامح",
      labelEn: "MLAMH Intelligence",
      descriptionAr: "السوق، العرض والنمو",
      descriptionEn: "Market, supply and growth intelligence",
      href: "/admin/intelligence",
      icon: BrainCircuit,
    },
    {
      labelAr: "مركز التسويق",
      labelEn: "Marketing Hub",
      descriptionAr: "الحملات، المحتوى والأتمتة",
      descriptionEn: "Campaigns, content and automation",
      href: "/admin/marketing",
      icon: Megaphone,
    },
  ];

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen">
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "مركز التشغيل" : "OPERATIONS CONSOLE"}
          title={isArabic ? "نظرة عامة" : "Overview"}
          description={
            isArabic
              ? "صورة تشغيلية مختصرة لما يحتاج قرارًا الآن، مع وصول مباشر لأهم أقسام المنصة."
              : "A concise operational view of what needs attention now, with direct access to the platform's core workspaces."
          }
          actions={
            <>
              <Link
                href={withLanguage("/admin/action-center", language)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-xs font-semibold text-black transition hover:opacity-90"
              >
                <CircleAlert className="h-4 w-4" />
                {isArabic ? "فتح مركز الإجراءات" : "Open Action Center"}
              </Link>
              <Link
                href={withLanguage("/admin/opportunities/new", language)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.09] px-4 text-xs font-medium text-white/60 transition hover:border-gold/20 hover:text-gold"
              >
                <Sparkles className="h-4 w-4" />
                {isArabic ? "فرصة جديدة" : "New Opportunity"}
              </Link>
            </>
          }
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
          <AdminCard className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      totalActionRequired > 0 ? "bg-gold" : "bg-emerald-400/70"
                    }`}
                  />
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/32">
                    {isArabic ? "طابور العمل" : "WORK QUEUE"}
                  </p>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white/90">
                  {isArabic ? "ما يحتاج تدخلك الآن" : "What needs your attention"}
                </h2>
              </div>

              <div className="flex items-end gap-3">
                <span className="text-4xl font-semibold tabular-nums tracking-[-0.05em] text-gold">
                  {totalActionRequired}
                </span>
                <span className="pb-1 text-[11px] text-white/30">
                  {isArabic ? "مهمة" : "tasks"}
                </span>
              </div>
            </div>

            <div className="grid gap-px bg-white/[0.055] sm:grid-cols-2 lg:grid-cols-3">
              {actionItems.map((item) => {
                const Icon = item.icon;
                const active = item.value > 0;

                return (
                  <Link
                    key={item.labelEn}
                    href={withLanguage(item.href, language)}
                    className="group bg-[#090909] p-4 transition hover:bg-white/[0.025] sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          active
                            ? "bg-gold/[0.08] text-gold"
                            : "bg-white/[0.025] text-white/25"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-white/15 transition group-hover:text-gold" />
                    </div>
                    <p className="mt-4 text-2xl font-semibold tabular-nums text-white/88">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-white/38">
                      {isArabic ? item.labelAr : item.labelEn}
                    </p>
                  </Link>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="p-5 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold/80">
              {isArabic ? "وصول سريع" : "QUICK ACCESS"}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white/88">
              {isArabic ? "مساحات العمل الأساسية" : "Core workspaces"}
            </h2>

            <div className="mt-5 space-y-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={withLanguage(item.href, language)}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3.5 transition hover:border-gold/18 hover:bg-white/[0.025]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-white/38 transition group-hover:bg-gold/[0.08] group-hover:text-gold">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-white/72 group-hover:text-white/90">
                        {isArabic ? item.labelAr : item.labelEn}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-white/28">
                        {isArabic ? item.descriptionAr : item.descriptionEn}
                      </span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/15 group-hover:text-gold" />
                  </Link>
                );
              })}
            </div>
          </AdminCard>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            href={withLanguage("/admin/talents", language)}
            label={isArabic ? "إجمالي المواهب" : "Total talents"}
            value={talentStats.total}
          />
          <AdminStatCard
            href={withLanguage("/admin/publishers", language)}
            label={isArabic ? "إجمالي الناشرين" : "Total publishers"}
            value={publishersTotal}
          />
          <AdminStatCard
            href={withLanguage("/admin/opportunities", language)}
            label={isArabic ? "الفرص المنشورة / الإجمالي" : "Published / total opportunities"}
            value={`${publishedOpportunities} / ${opportunitiesTotal}`}
          />
          <AdminStatCard
            href={withLanguage("/admin/opportunity-applications", language)}
            label={isArabic ? "إجمالي طلبات التقديم" : "Total applications"}
            value={applicationsTotal}
          />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <AdminCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/28">
                  {isArabic ? "إعادات الإرسال" : "RESUBMISSIONS"}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-white/88">
                  {isArabic ? "فرص عادت للمراجعة" : "Opportunities back for review"}
                </h2>
              </div>
              <Link
                href={withLanguage("/admin/opportunities?status=pending_review", language)}
                className="shrink-0 text-xs font-medium text-gold transition hover:text-white"
              >
                {isArabic ? "عرض الكل" : "View all"}
              </Link>
            </div>

            {recentResubmissions.length > 0 ? (
              <div className="divide-y divide-white/[0.055]">
                {recentResubmissions.map((item) => (
                  <Link
                    key={item.eventId}
                    href={withLanguage(
                      `/admin/opportunities/${item.opportunityId}`,
                      language,
                    )}
                    className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02] sm:px-6"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/[0.06] text-amber-200/80">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-white/72 group-hover:text-white">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-white/27">
                        #{item.opportunityId} · {formatDateTime(item.createdAt, language)}
                      </span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/15 group-hover:text-gold" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <BriefcaseBusiness className="mx-auto h-6 w-6 text-white/12" />
                <p className="mt-3 text-sm text-white/34">
                  {isArabic
                    ? "لا توجد فرص معادة للمراجعة حاليًا."
                    : "No resubmitted opportunities right now."}
                </p>
              </div>
            )}
          </AdminCard>

          {canViewAdminAccess ? (
            <AdminCard className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/[0.08] text-gold">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold/80">
                    {isArabic ? "الأمان والحوكمة" : "SECURITY & GOVERNANCE"}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white/88">
                    {isArabic ? "مركز الوصول الإداري" : "Admins & Access Center"}
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-xs leading-6 text-white/36">
                {isArabic
                  ? "إدارة المشرفين والصلاحيات، حالة MFA، الحسابات الخاملة، وسجل العمليات الحساسة."
                  : "Manage admin identities, permissions, MFA state, dormant accounts and privileged audit history."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  href={withLanguage("/admin/admins", language)}
                  className="rounded-xl border border-white/[0.07] bg-black/20 p-3 transition hover:border-gold/20"
                >
                  <UsersRound className="h-4 w-4 text-gold/80" />
                  <p className="mt-2 text-xs font-medium text-white/65">
                    {isArabic ? "المشرفون" : "Admins"}
                  </p>
                </Link>
                <Link
                  href={withLanguage("/admin/audit-log", language)}
                  className="rounded-xl border border-white/[0.07] bg-black/20 p-3 transition hover:border-gold/20"
                >
                  <History className="h-4 w-4 text-gold/80" />
                  <p className="mt-2 text-xs font-medium text-white/65">
                    {isArabic ? "سجل العمليات" : "Audit log"}
                  </p>
                </Link>
              </div>
            </AdminCard>
          ) : (
            <AdminCard className="p-5 sm:p-6">
              <MonitorCog className="h-5 w-5 text-white/22" />
              <h2 className="mt-4 text-base font-semibold text-white/78">
                {isArabic ? "إدارة المنصة" : "Platform management"}
              </h2>
              <p className="mt-2 text-xs leading-6 text-white/34">
                {isArabic
                  ? "الأسواق، إعدادات الموقع، وإدارة المحتوى العام من مساحة موحدة."
                  : "Markets, website settings and public-site controls in one workspace."}
              </p>
              <Link
                href={withLanguage("/admin/site-management", language)}
                className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-gold"
              >
                {isArabic ? "فتح إدارة الموقع" : "Open site management"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </AdminCard>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/28">
                {isArabic ? "إشارات الاستخدام" : "USAGE SIGNALS"}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white/88">
                {isArabic ? "أكثر المواهب مشاهدة" : "Most viewed talents"}
              </h2>
            </div>
            <Link
              href={withLanguage("/admin/analytics", language)}
              className="text-xs font-medium text-gold transition hover:text-white"
            >
              {isArabic ? "فتح التحليلات" : "Open analytics"}
            </Link>
          </div>

          <AdminTalentAnalytics topViewedTalents={topViewedTalents} />
        </section>
      </AdminPageContainer>
    </div>
  );
}
