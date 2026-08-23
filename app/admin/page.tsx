import Link from "next/link";

import { AdminTalentAnalytics } from "@/components/admin/AdminTalentAnalytics";
import {
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";

import {
  getAdminLanguage,
  type AdminLanguage,
} from "@/lib/admin/i18n";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TalentService } from "@/lib/services/talents/TalentService";
import { PublisherService } from "@/lib/services/publishers/PublisherService";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

type EventMetadata = Record<string, unknown>;

type ResubmittedOpportunity = {
  id: number;
  title: string;
  publisher_id: number | null;
  updated_at: string | null;
  status: string | null;
};

function withLanguage(
  href: string,
  language: AdminLanguage,
) {
  const separator = href.includes("?")
    ? "&"
    : "?";

  return `${href}${separator}lang=${language}`;
}

function getMetadataObject(
  value: unknown,
): EventMetadata {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as EventMetadata;
  }

  return {};
}

function getMetadataNumber(
  metadata: EventMetadata,
  key: string,
) {
  const value = metadata[key];

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const numeric = Number(value);

    return Number.isFinite(numeric)
      ? numeric
      : null;
  }

  return null;
}

function formatDateTime(
  value: string | null | undefined,
  language: AdminLanguage,
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    language === "ar"
      ? "ar-SA-u-nu-latn"
      : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default async function AdminPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const resolvedSearchParams =
    await searchParams;

  const language = getAdminLanguage(
    resolvedSearchParams.lang,
  );

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
  
    /*
     * طلبات تعديل البيانات المحمية للمواهب:
     * الاسم / الجوال / الجنسية وغيرها.
     */
    adminClient
      .from(
        "talent_profile_change_requests",
      )
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending"),
  
    /*
     * ملفات المواهب التي أُرسلت
     * أو أعيد إرسالها للمراجعة.
     *
     * المصدر الرئيسي:
     * profiles.approval_status
     */
    adminClient
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("account_type", "talent")
      .eq("approval_status", "pending"),
  
    /*
 * الناشرون الفعليون المسجلون
    * في publishers والمربوطون بحساباتهم.
    */
   PublisherService.getAll(),
  
          /*
     * طلبات توثيق الجهات
     * بانتظار قرار الإدارة.
     */
    adminClient
    .from("publishers")
    .select("id", {
      count: "exact",
      head: true,
    })
    .neq("publisher_type", "individual")
    .eq("verification_status", "pending"),
    
    /*
     * الفرص بانتظار مراجعة الإدارة.
     */
    adminClient
      .from("opportunities")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "status",
        "pending_review",
      ),
  
    /*
     * الرسائل المبلّغ عنها
     * ولم تتم مراجعتها.
     */
    adminClient
      .from("messages")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not(
        "reported_at",
        "is",
        null,
      )
      .is(
        "report_reviewed_at",
        null,
      ),
  
    /*
     * إجمالي الناشرين.
     */
    adminClient
      .from("publishers")
      .select("id", {
        count: "exact",
        head: true,
      }),
  
    /*
     * إجمالي الفرص.
     */
    adminClient
      .from("opportunities")
      .select("id", {
        count: "exact",
        head: true,
      }),
  
    /*
     * الفرص المنشورة.
     */
    adminClient
      .from("opportunities")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("published", true),
  
    /*
     * إجمالي طلبات التقديم.
     */
    adminClient
      .from(
        "opportunity_applications",
      )
      .select("id", {
        count: "exact",
        head: true,
      }),
  
    /*
     * الفرص التي أعاد الناشر
     * إرسالها بعد طلب التعديل.
     */
    adminClient
      .from("events")
      .select(`
        id,
        metadata,
        created_at
      `)
      .eq(
        "event_type",
        "opportunity_pending_review",
      )
      .contains("metadata", {
        reason:
          "resubmitted_after_changes",
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(6),
  ]);

  const logError = (
    label: string,
    error: unknown,
  ) => {
    if (error) {
      console.error(
        `[AdminDashboard ${label}]`,
        error,
      );
    }
  };

  logError(
    "pendingTalentChanges",
    pendingTalentChangesResult.error,
  );

  logError(
    "pendingTalents",
    pendingTalentsResult.error,
  );

  logError(
    "pendingPublisherVerifications",
    pendingPublisherVerificationsResult.error,
  );

  logError(
    "pendingOpportunities",
    pendingOpportunitiesResult.error,
  );

  logError(
    "reportedMessages",
    reportedMessagesResult.error,
  );

  logError(
    "publishersTotal",
    publishersTotalResult.error,
  );

  logError(
    "opportunitiesTotal",
    opportunitiesTotalResult.error,
  );

  logError(
    "publishedOpportunities",
    publishedOpportunitiesResult.error,
  );

  logError(
    "applicationsTotal",
    applicationsTotalResult.error,
  );

  logError(
    "resubmittedEvents",
    resubmittedEventsResult.error,
  );

  const pendingTalentChanges =
    pendingTalentChangesResult.error
      ? 0
      : pendingTalentChangesResult.count ??
        0;

        const pendingTalents =
  pendingTalentsResult.error
    ? 0
    : pendingTalentsResult.count ??
      0;

      const pendingPublishers =
      pendingPublishersData.filter(
        (publisher) =>
          publisher.approval_status === "pending",
      ).length;

        const pendingPublisherVerifications =
  pendingPublisherVerificationsResult.error
    ? 0
    : pendingPublisherVerificationsResult.count ?? 0;

  const pendingOpportunities =
    pendingOpportunitiesResult.error
      ? 0
      : pendingOpportunitiesResult.count ??
        0;

  const reportedMessages =
    reportedMessagesResult.error
      ? 0
      : reportedMessagesResult.count ??
        0;

  const publishersTotal =
    publishersTotalResult.error
      ? 0
      : publishersTotalResult.count ?? 0;

  const opportunitiesTotal =
    opportunitiesTotalResult.error
      ? 0
      : opportunitiesTotalResult.count ??
        0;

  const publishedOpportunities =
    publishedOpportunitiesResult.error
      ? 0
      : publishedOpportunitiesResult.count ??
        0;

  const applicationsTotal =
    applicationsTotalResult.error
      ? 0
      : applicationsTotalResult.count ??
        0;

  /*
   * استخراج أرقام الفرص من Events.
   */
  const resubmittedEvents =
    resubmittedEventsResult.data ?? [];

  const resubmittedOpportunityIds =
    Array.from(
      new Set(
        resubmittedEvents
          .map((event) => {
            const metadata =
              getMetadataObject(
                event.metadata,
              );

            return getMetadataNumber(
              metadata,
              "opportunityId",
            );
          })
          .filter(
            (
              opportunityId,
            ): opportunityId is number =>
              typeof opportunityId ===
              "number",
          ),
      ),
    );

  let resubmittedOpportunities:
    ResubmittedOpportunity[] = [];

  if (
    resubmittedOpportunityIds.length > 0
  ) {
    const {
      data,
      error,
    } = await adminClient
    .from("opportunities")
    .select(`
      id,
      title,
      publisher_id,
      updated_at,
      status
    `)
    .in(
      "id",
      resubmittedOpportunityIds,
    )
    .eq(
      "status",
      "pending_review",
    );

    if (error) {
      console.error(
        "[AdminDashboard resubmittedOpportunities]",
        error,
      );
    } else {
      resubmittedOpportunities =
        (data ??
          []) as ResubmittedOpportunity[];
    }
  }

  const opportunitiesById =
    new Map(
      resubmittedOpportunities.map(
        (opportunity) => [
          opportunity.id,
          opportunity,
        ],
      ),
    );

  const recentResubmissions =
    resubmittedEvents
      .map((event) => {
        const metadata =
          getMetadataObject(
            event.metadata,
          );

        const opportunityId =
          getMetadataNumber(
            metadata,
            "opportunityId",
          );

        if (!opportunityId) {
          return null;
        }

        const opportunity =
  opportunitiesById.get(
    opportunityId,
  );

if (!opportunity) {
  return null;
}

return {
  eventId: event.id,
  opportunityId,
  title: opportunity.title,
  createdAt:
    event.created_at ?? null,
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

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen"
    >
      <AdminPageContainer>
        <AdminPageHeader
          title={
            isArabic
              ? "لوحة التحكم"
              : "Dashboard"
          }
          description={
            isArabic
              ? "مركز متابعة عمليات منصة ملامح والمهام التي تحتاج تدخلك."
              : "Monitor MLAMH operations and tasks that need your attention."
          }
        />

        {/* Action Center */}
        <section className="mb-10 rounded-[2rem] border border-gold/15 bg-gradient-to-br from-gold/[0.08] via-white/[0.025] to-transparent p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-gold">
                {isArabic
                  ? "مركز العمليات"
                  : "Operations Center"}
              </p>

              <h2 className="mt-2 text-2xl font-light text-white sm:text-3xl">
                {isArabic
                  ? "يتطلب إجراء"
                  : "Action Required"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/40">
                {isArabic
                  ? "المهام التي تحتاج مراجعة أو قرارًا من الإدارة."
                  : "Tasks requiring review or an admin decision."}
              </p>
            </div>

            <div className="rounded-2xl border border-gold/20 bg-black/25 px-5 py-3">
              <p className="text-xs text-white/35">
                {isArabic
                  ? "إجمالي المهام"
                  : "Total Actions"}
              </p>

              <p className="mt-1 text-3xl font-light text-gold">
                {totalActionRequired}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard
  href={withLanguage(
    "/admin/talents?review=pending",
    language,
  )}
  label={
    isArabic
      ? "ملفات مواهب بانتظار المراجعة"
      : "Talents Awaiting Review"
  }
  value={pendingTalents}
  active={pendingTalents > 0}
/>

            <AdminStatCard
              href={withLanguage(
                "/admin/action-center",
                language,
              )}
              label={
                isArabic
                  ? "تعديلات ملفات المواهب"
                  : "Talent Profile Changes"
              }
              value={
                pendingTalentChanges
              }
              active={
                pendingTalentChanges > 0
              }
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/publishers",
                language,
              )}
              label={
                isArabic
                  ? "ناشرون بانتظار الاعتماد"
                  : "Publishers Awaiting Approval"
              }
              value={pendingPublishers}
              active={
                pendingPublishers > 0
              }
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/opportunities?status=pending_review",
                language,
              )}
              label={
                isArabic
                  ? "فرص بانتظار المراجعة"
                  : "Opportunities Awaiting Review"
              }
              value={
                pendingOpportunities
              }
              active={
                pendingOpportunities > 0
              }
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/messages",
                language,
              )}
              label={
                isArabic
                  ? "بلاغات تحتاج مراجعة"
                  : "Reports Awaiting Review"
              }
              value={reportedMessages}
              active={
                reportedMessages > 0
              }
            />
          </div>
        </section>

        {/* Resubmitted opportunities */}
        <section className="mb-10 rounded-[2rem] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                {isArabic
                  ? "إعادات الإرسال"
                  : "Resubmissions"}
              </p>

              <h2 className="mt-2 text-2xl font-light text-white">
                {isArabic
                  ? "فرص عادت بعد تنفيذ التعديلات"
                  : "Opportunities resubmitted after changes"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/40">
                {isArabic
                  ? "هذه الفرص سبق أن طلبت الإدارة تعديلها ثم أعاد الناشر إرسالها للمراجعة."
                  : "These opportunities were previously returned for changes and have now been resubmitted."}
              </p>
            </div>

            <Link
              href={withLanguage(
                "/admin/opportunities?status=pending_review",
                language,
              )}
              className="text-sm text-gold transition hover:text-white"
            >
              {isArabic
                ? "عرض جميع الفرص ←"
                : "View all opportunities →"}
            </Link>
          </div>

          {recentResubmissions.length >
          0 ? (
            <div className="mt-6 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.08]">
              {recentResubmissions.map(
                (item) => (
                  <div
                    key={item.eventId}
                    className="flex flex-col gap-4 bg-black/20 p-5 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-3 py-1 text-[10px] text-amber-300">
                          {isArabic
                            ? "أعيد إرسالها"
                            : "Resubmitted"}
                        </span>

                        <span className="text-xs text-white/25">
                          #
                          {
                            item.opportunityId
                          }
                        </span>
                      </div>

                      <p className="mt-3 truncate text-lg font-light text-white">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs text-white/30">
                        {formatDateTime(
                          item.createdAt,
                          language,
                        )}
                      </p>
                    </div>

                    <Link
                      href={withLanguage(
                        `/admin/opportunities?opportunity=${item.opportunityId}`,
                        language,
                      )}
                      className="inline-flex shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.05] px-5 py-2.5 text-xs text-gold transition hover:bg-gold hover:text-black"
                    >
                      {isArabic
                        ? "مراجعة الفرصة"
                        : "Review Opportunity"}
                    </Link>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/[0.08] bg-black/20 p-8 text-center">
              <p className="text-sm text-white/35">
                {isArabic
                  ? "لا توجد حاليًا فرص أعيد إرسالها بعد التعديل."
                  : "There are currently no opportunities resubmitted after changes."}
              </p>
            </div>
          )}
        </section>

        {/* Platform overview */}
        <section className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isArabic
                ? "نظرة عامة"
                : "Platform Overview"}
            </p>

            <h2 className="mt-2 text-2xl font-light text-white">
              {isArabic
                ? "حالة المنصة"
                : "Platform Status"}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard
              href={withLanguage(
                "/admin/talents",
                language,
              )}
              label={
                isArabic
                  ? "إجمالي المواهب"
                  : "Total Talents"
              }
              value={talentStats.total}
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/publishers",
                language,
              )}
              label={
                isArabic
                  ? "إجمالي الناشرين"
                  : "Total Publishers"
              }
              value={publishersTotal}
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/opportunities",
                language,
              )}
              label={
                isArabic
                  ? "إجمالي الفرص"
                  : "Total Opportunities"
              }
              value={opportunitiesTotal}
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/opportunities?status=published",
                language,
              )}
              label={
                isArabic
                  ? "الفرص المنشورة"
                  : "Published Opportunities"
              }
              value={
                publishedOpportunities
              }
            />

            <AdminStatCard
              href={withLanguage(
                "/admin/applications",
                language,
              )}
              label={
                isArabic
                  ? "إجمالي الطلبات"
                  : "Total Applications"
              }
              value={applicationsTotal}
            />
          </div>
        </section>

        {/* Analytics */}
        <section>
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isArabic
                ? "التحليلات"
                : "Analytics"}
            </p>

            <h2 className="mt-2 text-2xl font-light text-white">
              {isArabic
                ? "الأكثر مشاهدة"
                : "Most Viewed"}
            </h2>

            <p className="mt-2 text-sm text-white/35">
              {isArabic
                ? "المواهب التي حققت أعلى عدد من مشاهدات الملف."
                : "Talent profiles with the highest number of views."}
            </p>
          </div>

          <AdminTalentAnalytics
            topViewedTalents={
              topViewedTalents
            }
          />
        </section>
      </AdminPageContainer>
    </div>
  );
}