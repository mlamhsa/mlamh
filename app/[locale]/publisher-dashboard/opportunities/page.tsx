import Link from "next/link";

import { StatCard } from "@/components/ui";
import {
  archiveOpportunityAction,
  closeOpportunityAction,
  restoreOpportunityAction,
} from "@/lib/actions/opportunity-status-actions";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOpportunityStatusClass,
  getOpportunityStatusLabel,
} from "@/lib/utils/opportunity-status";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ status?: string }>;
};

function formatDate(value?: string | null, locale = "en") {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function getCity(
  opportunity: {
    city_ar?: string | null;
    city_en?: string | null;
  },
  locale: string,
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
  const filters = (await searchParams) ?? {};

  const isRtl = locale === "ar";
  const statusLocale = isRtl ? "ar" : "en";
  const selectedStatus = filters.status ?? "all";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const isVerified = publisher.verified === true;
  const isSuspended = publisher.status === "suspended";
  const canCreateOpportunity = isVerified && !isSuspended;

  const { data: opportunities, error: opportunitiesError } = await adminClient
    .from("opportunities")
    .select(
      "id, title, slug, city_ar, city_en, opportunity_type, status, created_at",
    )
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false });

  if (opportunitiesError) {
    console.error("Publisher opportunities error:", opportunitiesError);
  }

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
      (applicationsByOpportunity.get(application.opportunity_id) ?? 0) + 1,
    );
  }

  const publishedCount = allOpportunities.filter(
    (item) => item.status === "published" || item.status === "open",
  ).length;

  const reviewCount = allOpportunities.filter(
    (item) => item.status === "pending_review",
  ).length;

  const closedCount = allOpportunities.filter(
    (item) => item.status === "closed",
  ).length;

  const archivedCount = allOpportunities.filter(
    (item) => item.status === "archived",
  ).length;

  const applicantsTotal = applications?.length ?? 0;

  const filteredOpportunities =
    selectedStatus === "all"
      ? allOpportunities
      : selectedStatus === "published"
        ? allOpportunities.filter(
            (item) =>
              item.status === "published" || item.status === "open",
          )
        : allOpportunities.filter(
            (item) => item.status === selectedStatus,
          );

  const tabs = [
    [
      "all",
      isRtl
        ? `الكل (${allOpportunities.length})`
        : `All (${allOpportunities.length})`,
    ],
    [
      "pending_review",
      isRtl
        ? `قيد المراجعة (${reviewCount})`
        : `In Review (${reviewCount})`,
    ],
    [
      "published",
      isRtl
        ? `منشورة (${publishedCount})`
        : `Published (${publishedCount})`,
    ],
    [
      "closed",
      isRtl ? `مغلقة (${closedCount})` : `Closed (${closedCount})`,
    ],
    [
      "archived",
      isRtl
        ? `مؤرشفة (${archivedCount})`
        : `Archived (${archivedCount})`,
    ],
  ];

  return (
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
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

          {canCreateOpportunity ? (
            <Link
              href={`/${locale}/opportunities/new`}
              className="arabic-safe inline-flex rounded-full border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
            </Link>
          ) : !isSuspended ? (
            <Link
              href={`/${locale}/publisher-dashboard/profile`}
              className="arabic-safe inline-flex rounded-full border border-gold bg-gold/10 px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "مراجعة ملف الشركة" : "Review Company Profile"}
            </Link>
          ) : null}
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            label={isRtl ? "إجمالي الفرص" : "Total"}
            value={allOpportunities.length}
          />

          <StatCard
            label={isRtl ? "قيد المراجعة" : "In Review"}
            value={reviewCount}
          />

          <StatCard
            label={isRtl ? "منشورة" : "Published"}
            value={publishedCount}
          />

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
                  className={`rounded-full border px-5 py-3 text-xs uppercase tracking-[0.22em] transition ${
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
              <div className="arabic-safe hidden grid-cols-[1.5fr_0.8fr_0.8fr_1.4fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.22em] text-white/35 lg:grid">
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
                          <span className="arabic-safe text-[11px] uppercase tracking-[0.2em] text-white/25">
                            {getCity(opportunity, locale) ?? "-"}
                          </span>

                          {opportunity.opportunity_type ? (
                            <span className="arabic-safe text-[11px] uppercase tracking-[0.2em] text-white/25">
                              {opportunity.opportunity_type.replaceAll(
                                "_",
                                " ",
                              )}
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
                          className={`arabic-safe inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${getOpportunityStatusClass(
                            opportunity.status,
                          )}`}
                        >
                          {getOpportunityStatusLabel(
                            opportunity.status,
                            statusLocale,
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`}
                          className="arabic-safe rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/60 transition hover:border-white/40 hover:text-white"
                        >
                          {isRtl ? "عرض" : "View"}
                        </Link>

                        <Link
                          href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`}
                          className="arabic-safe rounded-full border border-blue-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-blue-300 transition hover:bg-blue-400 hover:text-black"
                        >
                          {isRtl ? "تعديل" : "Edit"}
                        </Link>

                        {(opportunity.status === "open" ||
                          opportunity.status === "published") && (
                          <form
                            action={closeOpportunityAction.bind(
                              null,
                              opportunity.id,
                            )}
                          >
                            <button
                              type="submit"
                              className="arabic-safe rounded-full border border-yellow-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-yellow-300 transition hover:bg-yellow-400 hover:text-black"
                            >
                              {isRtl ? "إغلاق" : "Close"}
                            </button>
                          </form>
                        )}

                        {opportunity.status !== "archived" ? (
                          <form
                            action={archiveOpportunityAction.bind(
                              null,
                              opportunity.id,
                            )}
                          >
                            <button
                              type="submit"
                              className="arabic-safe rounded-full border border-red-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-400 hover:text-black"
                            >
                              {isRtl ? "أرشفة" : "Archive"}
                            </button>
                          </form>
                        ) : (
                          <form
                            action={restoreOpportunityAction.bind(
                              null,
                              opportunity.id,
                            )}
                          >
                            <button
                              type="submit"
                              className="arabic-safe rounded-full border border-emerald-400/40 px-3 py-2 text-xs uppercase tracking-[0.18em] text-emerald-300 transition hover:bg-emerald-400 hover:text-black"
                            >
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
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-10 text-center">
              <p className="text-white/45">
                {isRtl
                  ? "لا توجد فرص مطابقة للحالة المحددة."
                  : "No opportunities match the selected status."}
              </p>

              {canCreateOpportunity ? (
                <Link
                  href={`/${locale}/opportunities/new`}
                  className="mt-6 inline-flex rounded-full border border-gold bg-gold/10 px-6 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
                >
                  {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
                </Link>
              ) : !isSuspended ? (
                <Link
                  href={`/${locale}/publisher-dashboard/profile`}
                  className="mt-6 inline-flex rounded-full border border-gold bg-gold/10 px-6 py-3 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-black"
                >
                  {isRtl ? "مراجعة ملف الشركة" : "Review Company Profile"}
                </Link>
              ) : null}
            </div>
          )}
        </section>
      </div>
  );
}