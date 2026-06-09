import Link from "next/link";
import PublisherShell from "@/components/publisher/PublisherShell";
import {
  archiveOpportunityAction,
  closeOpportunityAction,
  restoreOpportunityAction,
} from "@/lib/actions/opportunity-status-actions";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ status?: string }>;
};

function statusLabel(status?: string | null, isRtl = false) {
  switch (status) {
    case "draft":
      return isRtl ? "مسودة" : "Draft";
    case "open":
      return isRtl ? "مفتوحة" : "Open";
    case "published":
      return isRtl ? "منشورة" : "Published";
    case "closed":
      return isRtl ? "مغلقة" : "Closed";
    case "archived":
      return isRtl ? "مؤرشفة" : "Archived";
    default:
      return "-";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "draft":
      return "border-white/15 bg-white/5 text-white/50";
    case "open":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "published":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "closed":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "archived":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    default:
      return "border-white/15 bg-white/5 text-white/60";
  }
}

function formatDate(value?: string | null, locale = "en") {
  if (!value) return "-";

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getCity(
  opportunity: { city_ar?: string | null; city_en?: string | null },
  locale: string
) {
  return locale === "ar"
    ? opportunity.city_ar ?? opportunity.city_en
    : opportunity.city_en ?? opportunity.city_ar;
}

export default async function PublisherOpportunitiesPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";
  const filters = searchParams ? await searchParams : {};
  const selectedStatus = filters.status ?? "all";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: opportunities } = await adminClient
    .from("opportunities")
    .select(
      "id, title, slug, city_ar, city_en, opportunity_type, status, created_at"
    )
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false });

  const allOpportunities = opportunities ?? [];
  const opportunityIds = allOpportunities.map((item) => item.id);

  const { data: applications } =
    opportunityIds.length > 0
      ? await adminClient
          .from("opportunity_applications")
          .select("id, opportunity_id")
          .in("opportunity_id", opportunityIds)
      : { data: [] };

  const applicationsByOpportunity = new Map<number, number>();

  for (const application of applications ?? []) {
    applicationsByOpportunity.set(
      application.opportunity_id,
      (applicationsByOpportunity.get(application.opportunity_id) ?? 0) + 1
    );
  }

  const openCount = allOpportunities.filter(
    (item) => item.status === "open"
  ).length;
  const closedCount = allOpportunities.filter(
    (item) => item.status === "closed"
  ).length;
  const archivedCount = allOpportunities.filter(
    (item) => item.status === "archived"
  ).length;
  const applicantsTotal = (applications ?? []).length;

  const filteredOpportunities =
    selectedStatus === "all"
      ? allOpportunities
      : allOpportunities.filter((item) => item.status === selectedStatus);

  const tabs = [
    [
      "all",
      isRtl
        ? `الكل (${allOpportunities.length})`
        : `All (${allOpportunities.length})`,
    ],
    ["open", isRtl ? `مفتوحة (${openCount})` : `Open (${openCount})`],
    ["closed", isRtl ? `مغلقة (${closedCount})` : `Closed (${closedCount})`],
    [
      "archived",
      isRtl ? `مؤرشفة (${archivedCount})` : `Archived (${archivedCount})`,
    ],
  ];

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "مركز الفرص" : "Opportunities Center"}
            </p>

            <h1 className="mt-3 text-4xl font-light text-white">
              {isRtl ? "إدارة الفرص" : "Manage Opportunities"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "تابع كل فرصك، راقب عدد المتقدمين، وأدر حالة كل فرصة من مكان واحد."
                : "Track all opportunities, monitor applicants, and manage every opportunity from one workspace."}
            </p>
          </div>

          <Link
            href={`/${locale}/opportunities/new`}
            className="inline-flex border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            label={isRtl ? "إجمالي الفرص" : "Total"}
            value={allOpportunities.length}
          />
          <StatCard label={isRtl ? "مفتوحة" : "Open"} value={openCount} />
          <StatCard label={isRtl ? "مغلقة" : "Closed"} value={closedCount} />
          <StatCard
            label={isRtl ? "المتقدمون" : "Applicants"}
            value={applicantsTotal}
            highlighted
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-3">
              {tabs.map(([value, label]) => (
                <Link
                  key={value}
                  href={
                    value === "all"
                      ? `/${locale}/publisher-dashboard/opportunities`
                      : `/${locale}/publisher-dashboard/opportunities?status=${value}`
                  }
                  className={`border px-5 py-3 text-xs uppercase tracking-[0.22em] transition ${
                    selectedStatus === value
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-white/10 text-white/50 hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            <p className="text-sm text-white/35">
              {isRtl
                ? `${filteredOpportunities.length} فرصة معروضة`
                : `${filteredOpportunities.length} shown`}
            </p>
          </div>

          {filteredOpportunities.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="hidden grid-cols-[1.5fr_0.8fr_0.8fr_1.4fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.22em] text-white/35 lg:grid">
                <div>{isRtl ? "الفرصة" : "Opportunity"}</div>
                <div>{isRtl ? "المتقدمون" : "Applicants"}</div>
                <div>{isRtl ? "الحالة" : "Status"}</div>
                <div>{isRtl ? "الإجراءات" : "Actions"}</div>
              </div>

              <div className="divide-y divide-white/10">
                {filteredOpportunities.map((opportunity) => {
                  const applicantsCount =
                    applicationsByOpportunity.get(opportunity.id) ?? 0;

                  return (
                    <article
                      key={opportunity.id}
                      className="grid gap-5 bg-black/20 p-5 transition hover:bg-white/[0.03] lg:grid-cols-[1.5fr_0.8fr_0.8fr_1.4fr] lg:items-center"
                    >
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                            {getCity(opportunity, locale) ?? "-"}
                          </span>

                          {opportunity.opportunity_type ? (
                            <span className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                              {opportunity.opportunity_type.replaceAll("_", " ")}
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-xl font-light text-white">
                          {opportunity.title}
                        </h2>

                        <p className="mt-2 text-sm text-white/35">
                          {formatDate(opportunity.created_at, locale)}
                        </p>
                      </div>

                      <div>
                        <p className="text-3xl font-light text-white">
                          {applicantsCount}
                        </p>
                        <p className="mt-1 text-xs text-white/35">
                          {isRtl ? "متقدم" : "applicants"}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusClass(
                            opportunity.status
                          )}`}
                        >
                          {statusLabel(opportunity.status, isRtl)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/applicants`}
                          className="border border-gold/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
                        >
                          {isRtl ? "المتقدمون" : "Applicants"}
                        </Link>

                        <Link
                          href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`}
                          className="border border-blue-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-blue-300 transition hover:bg-blue-400 hover:text-black"
                        >
                          {isRtl ? "تعديل" : "Edit"}
                        </Link>

                        {opportunity.status === "open" && (
                          <form
                            action={closeOpportunityAction.bind(
                              null,
                              opportunity.id
                            )}
                          >
                            <button className="border border-yellow-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-yellow-300 transition hover:bg-yellow-400 hover:text-black">
                              {isRtl ? "إغلاق" : "Close"}
                            </button>
                          </form>
                        )}

                        {opportunity.status !== "archived" ? (
                          <form
                            action={archiveOpportunityAction.bind(
                              null,
                              opportunity.id
                            )}
                          >
                            <button className="border border-red-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-400 hover:text-black">
                              {isRtl ? "أرشفة" : "Archive"}
                            </button>
                          </form>
                        ) : (
                          <form
                            action={restoreOpportunityAction.bind(
                              null,
                              opportunity.id
                            )}
                          >
                            <button className="border border-emerald-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black">
                              {isRtl ? "استعادة" : "Restore"}
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-white/45">
              {isRtl
                ? "لا توجد فرص مطابقة للحالة المحددة."
                : "No opportunities match the selected status."}
            </div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}

function StatCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 ${
        highlighted
          ? "border-gold/20 bg-gold/[0.04]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}