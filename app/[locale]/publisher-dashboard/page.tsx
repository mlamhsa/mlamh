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
};

type Opportunity = {
  id: number;
  title: string;
  status: string;
  city_ar?: string | null;
  city_en?: string | null;
  opportunity_type?: string | null;
  created_at?: string | null;
};

function statusLabel(status: string, isRtl: boolean) {
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

function statusClass(status: string) {
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
      return "border-white/15 bg-white/5 text-white/50";
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

function getCity(opportunity: Opportunity, locale: string) {
  return locale === "ar"
    ? opportunity.city_ar ?? opportunity.city_en ?? "-"
    : opportunity.city_en ?? opportunity.city_ar ?? "-";
}

function formatType(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

export default async function PublisherDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const { data: opportunities } = await adminClient
    .from("opportunities")
    .select("id, title, status, city_ar, city_en, opportunity_type, created_at")
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false });

  const allOpportunities: Opportunity[] = opportunities ?? [];

  const total = allOpportunities.length;
  const openCount = allOpportunities.filter((o) => o.status === "open").length;
  const closedCount = allOpportunities.filter((o) => o.status === "closed").length;
  const publishedCount = allOpportunities.filter(
    (o) => o.status === "published"
  ).length;

  const latestOpportunities = allOpportunities.slice(0, 6);

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "لوحة الناشر" : "Publisher Dashboard"}
            </p>

            <h1 className="mt-3 text-4xl font-light text-white">
              {isRtl ? "نظرة عامة" : "Overview"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
              {isRtl
                ? "إدارة مختصرة للفرص، الحالات، والمتقدمين من مساحة واحدة."
                : "A focused workspace for opportunities, statuses, and applicants."}
            </p>
          </div>

          <Link
            href={`/${locale}/opportunities/new`}
            className="inline-flex justify-center border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label={isRtl ? "إجمالي الفرص" : "Total"} value={total} />
          <StatCard label={isRtl ? "مفتوحة" : "Open"} value={openCount} />
          <StatCard label={isRtl ? "مغلقة" : "Closed"} value={closedCount} />
          <StatCard
            label={isRtl ? "منشورة" : "Published"}
            value={publishedCount}
          />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                {isRtl ? "آخر الفرص" : "Latest Opportunities"}
              </p>
              <h2 className="mt-3 text-2xl font-light text-white">
                {isRtl ? "إدارة سريعة" : "Quick Management"}
              </h2>
            </div>

            <Link
              href={`/${locale}/publisher-dashboard/opportunities`}
              className="text-sm text-gold underline underline-offset-4"
            >
              {isRtl ? "عرض كل الفرص" : "View all opportunities"}
            </Link>
          </div>

          {latestOpportunities.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="hidden grid-cols-[1.5fr_0.8fr_0.7fr_1.2fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.22em] text-white/35 lg:grid">
                <div>{isRtl ? "الفرصة" : "Opportunity"}</div>
                <div>{isRtl ? "المدينة" : "City"}</div>
                <div>{isRtl ? "الحالة" : "Status"}</div>
                <div>{isRtl ? "الإجراءات" : "Actions"}</div>
              </div>

              <div className="divide-y divide-white/10">
                {latestOpportunities.map((opportunity) => (
                  <article
                    key={opportunity.id}
                    className="grid gap-5 bg-black/20 p-5 transition hover:bg-white/[0.03] lg:grid-cols-[1.5fr_0.8fr_0.7fr_1.2fr] lg:items-center"
                  >
                    <div>
                      <h3 className="text-xl font-light text-white">
                        {opportunity.title}
                      </h3>

                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/30">
                        {formatType(opportunity.opportunity_type)} ·{" "}
                        {formatDate(opportunity.created_at, locale)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-white/55">
                        {getCity(opportunity, locale)}
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
                        href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`}
                        className="border border-blue-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-blue-300 transition hover:bg-blue-400 hover:text-black"
                      >
                        {isRtl ? "تعديل" : "Edit"}
                      </Link>

                      <Link
                        href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/applicants`}
                        className="border border-gold/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
                      >
                        {isRtl ? "المتقدمون" : "Applicants"}
                      </Link>

                      {opportunity.status === "open" && (
                        <form action={closeOpportunityAction.bind(null, opportunity.id)}>
                          <button className="border border-yellow-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-yellow-300 transition hover:bg-yellow-400 hover:text-black">
                            {isRtl ? "إغلاق" : "Close"}
                          </button>
                        </form>
                      )}

                      {opportunity.status !== "archived" ? (
                        <form action={archiveOpportunityAction.bind(null, opportunity.id)}>
                          <button className="border border-red-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-400 hover:text-black">
                            {isRtl ? "أرشفة" : "Archive"}
                          </button>
                        </form>
                      ) : (
                        <form action={restoreOpportunityAction.bind(null, opportunity.id)}>
                          <button className="border border-emerald-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black">
                            {isRtl ? "استعادة" : "Restore"}
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-10 text-center text-white/50">
              {isRtl ? "لا توجد فرص حتى الآن." : "No opportunities yet."}
            </div>
          )}
        </section>
      </div>
    </PublisherShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}