import {
    AdminCard,
    AdminGrid,
    AdminPageContainer,
    AdminPageHeader,
    AdminStatCard,
  } from "@/components/admin/ui";
  
  import { requireAdminAccess } from "@/lib/auth/require-admin";
  import { createAdminClient } from "@/lib/supabase/admin";
  
  export const metadata = {
    title: "Analytics — MLAMH Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
  
  export const dynamic =
    "force-dynamic";
  
  type PageProps = {
    searchParams: Promise<{
      lang?: string;
    }>;
  };
  
  function percentage(
    value: number,
    total: number,
  ) {
    if (total <= 0) {
      return 0;
    }
  
    return Math.round(
      (value / total) * 100,
    );
  }
  
  function MetricProgress({
    label,
    value,
    total,
  }: {
    label: string;
    value: number;
    total: number;
  }) {
    const percent =
      percentage(
        value,
        total,
      );
  
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs text-white/50">
            {label}
          </span>
  
          <span className="text-xs text-white/70">
            {value}
            {" · "}
            {percent}%
          </span>
        </div>
  
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gold/70"
            style={{
              width: `${Math.min(
                100,
                percent,
              )}%`,
            }}
          />
        </div>
      </div>
    );
  }
  
  export default async function AdminAnalyticsPage({
    searchParams,
  }: PageProps) {
    await requireAdminAccess();
  
    const {
      lang = "ar",
    } = await searchParams;
  
    const isArabic =
      lang !== "en";
  
    const adminClient =
      createAdminClient();
  
    const [
      talentsResult,
      approvedTalentsResult,
      pendingTalentsResult,
  
      publishersResult,
      approvedPublishersResult,
      pendingPublishersResult,
  
      opportunitiesResult,
      publishedOpportunitiesResult,
      pendingOpportunitiesResult,
  
      applicationsResult,
      pendingApplicationsResult,
      shortlistedApplicationsResult,
      acceptedApplicationsResult,
      rejectedApplicationsResult,
  
      conversationsResult,
      activeConversationsResult,
  
      messagesResult,
  
      notificationsResult,
      unreadNotificationsResult,
  
      reportsResult,
      openReportsResult,
    ] = await Promise.all([
      /*
       * TALENTS
       */
      adminClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "account_type",
          "talent",
        ),
  
      adminClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "account_type",
          "talent",
        )
        .eq(
          "approval_status",
          "approved",
        ),
  
      adminClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "account_type",
          "talent",
        )
        .eq(
          "approval_status",
          "pending",
        ),
  
      /*
       * PUBLISHERS
       */
      adminClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "account_type",
          "publisher",
        ),
  
      adminClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "account_type",
          "publisher",
        )
        .eq(
          "approval_status",
          "approved",
        ),
  
      adminClient
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "account_type",
          "publisher",
        )
        .eq(
          "approval_status",
          "pending",
        ),
  
      /*
       * OPPORTUNITIES
       */
      adminClient
        .from("opportunities")
        .select("id", {
          count: "exact",
          head: true,
        }),
  
      adminClient
        .from("opportunities")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "published",
        ),
  
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
       * APPLICATIONS
       */
      adminClient
        .from(
          "opportunity_applications",
        )
        .select("id", {
          count: "exact",
          head: true,
        }),
  
      adminClient
        .from(
          "opportunity_applications",
        )
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "pending",
        ),
  
      adminClient
        .from(
          "opportunity_applications",
        )
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "shortlisted",
        ),
  
      adminClient
        .from(
          "opportunity_applications",
        )
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "accepted",
        ),
  
      adminClient
        .from(
          "opportunity_applications",
        )
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "rejected",
        ),
  
      /*
       * CONVERSATIONS
       */
      adminClient
        .from("conversations")
        .select("id", {
          count: "exact",
          head: true,
        }),
  
      adminClient
        .from("conversations")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "active",
        ),
  
      /*
       * MESSAGES
       */
      adminClient
        .from("messages")
        .select("id", {
          count: "exact",
          head: true,
        }),
  
      /*
       * NOTIFICATIONS
       */
      adminClient
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        }),
  
      adminClient
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "is_read",
          false,
        ),
  
      /*
       * REPORTS
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
        ),
  
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
    ]);
  
    const results = [
      talentsResult,
      approvedTalentsResult,
      pendingTalentsResult,
      publishersResult,
      approvedPublishersResult,
      pendingPublishersResult,
      opportunitiesResult,
      publishedOpportunitiesResult,
      pendingOpportunitiesResult,
      applicationsResult,
      pendingApplicationsResult,
      shortlistedApplicationsResult,
      acceptedApplicationsResult,
      rejectedApplicationsResult,
      conversationsResult,
      activeConversationsResult,
      messagesResult,
      notificationsResult,
      unreadNotificationsResult,
      reportsResult,
      openReportsResult,
    ];
  
    const firstError =
      results.find(
        (result) =>
          result.error,
      )?.error;
  
    if (firstError) {
      throw new Error(
        `[AdminAnalyticsPage] ${firstError.message}`,
      );
    }
  
    const talents =
      talentsResult.count ?? 0;
  
    const approvedTalents =
      approvedTalentsResult.count ??
      0;
  
    const pendingTalents =
      pendingTalentsResult.count ??
      0;
  
    const publishers =
      publishersResult.count ?? 0;
  
    const approvedPublishers =
      approvedPublishersResult.count ??
      0;
  
    const pendingPublishers =
      pendingPublishersResult.count ??
      0;
  
    const opportunities =
      opportunitiesResult.count ??
      0;
  
    const publishedOpportunities =
      publishedOpportunitiesResult.count ??
      0;
  
    const pendingOpportunities =
      pendingOpportunitiesResult.count ??
      0;
  
    const applications =
      applicationsResult.count ?? 0;
  
    const pendingApplications =
      pendingApplicationsResult.count ??
      0;
  
    const shortlistedApplications =
      shortlistedApplicationsResult.count ??
      0;
  
    const acceptedApplications =
      acceptedApplicationsResult.count ??
      0;
  
    const rejectedApplications =
      rejectedApplicationsResult.count ??
      0;
  
    const conversations =
      conversationsResult.count ??
      0;
  
    const activeConversations =
      activeConversationsResult.count ??
      0;
  
    const messages =
      messagesResult.count ?? 0;
  
    const notifications =
      notificationsResult.count ??
      0;
  
    const unreadNotifications =
      unreadNotificationsResult.count ??
      0;
  
    const reports =
      reportsResult.count ?? 0;
  
    const openReports =
      openReportsResult.count ??
      0;
  
    const talentApprovalRate =
      percentage(
        approvedTalents,
        talents,
      );
  
    const publisherApprovalRate =
      percentage(
        approvedPublishers,
        publishers,
      );
  
    const opportunityPublishRate =
      percentage(
        publishedOpportunities,
        opportunities,
      );
  
    const applicationAcceptanceRate =
      percentage(
        acceptedApplications,
        applications,
      );
  
    const averageApplicationsPerOpportunity =
      opportunities > 0
        ? (
            applications /
            opportunities
          ).toFixed(1)
        : "0";
  
    const averageMessagesPerConversation =
      conversations > 0
        ? (
            messages /
            conversations
          ).toFixed(1)
        : "0";
  
    return (
      <AdminPageContainer>
        <AdminPageHeader
          title={
            isArabic
              ? "التحليلات"
              : "Analytics"
          }
          description={
            isArabic
              ? "نظرة تشغيلية شاملة على نمو المنصة، نشاط المستخدمين، الفرص، الطلبات والمحادثات."
              : "An operational overview of platform growth, users, opportunities, applications, and conversations."
          }
        />
  
        <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label={
              isArabic
                ? "المواهب"
                : "Talents"
            }
            value={talents}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "الناشرون"
                : "Publishers"
            }
            value={publishers}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "الفرص"
                : "Opportunities"
            }
            value={opportunities}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "طلبات التقديم"
                : "Applications"
            }
            value={applications}
          />
        </AdminGrid>
  
        <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "المواهب"
                : "Talents"}
            </p>
  
            <p className="mt-3 text-4xl font-light text-white">
              {talentApprovalRate}%
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? "نسبة الملفات المعتمدة"
                : "Approval rate"}
            </p>
  
            <div className="mt-6 space-y-4">
              <MetricProgress
                label={
                  isArabic
                    ? "معتمد"
                    : "Approved"
                }
                value={
                  approvedTalents
                }
                total={talents}
              />
  
              <MetricProgress
                label={
                  isArabic
                    ? "بانتظار المراجعة"
                    : "Pending"
                }
                value={
                  pendingTalents
                }
                total={talents}
              />
            </div>
          </AdminCard>
  
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "الناشرون"
                : "Publishers"}
            </p>
  
            <p className="mt-3 text-4xl font-light text-white">
              {publisherApprovalRate}%
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? "نسبة الحسابات المعتمدة"
                : "Approval rate"}
            </p>
  
            <div className="mt-6 space-y-4">
              <MetricProgress
                label={
                  isArabic
                    ? "معتمد"
                    : "Approved"
                }
                value={
                  approvedPublishers
                }
                total={publishers}
              />
  
              <MetricProgress
                label={
                  isArabic
                    ? "بانتظار المراجعة"
                    : "Pending"
                }
                value={
                  pendingPublishers
                }
                total={publishers}
              />
            </div>
          </AdminCard>
  
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "الفرص"
                : "Opportunities"}
            </p>
  
            <p className="mt-3 text-4xl font-light text-white">
              {opportunityPublishRate}%
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? "نسبة الفرص المنشورة"
                : "Publish rate"}
            </p>
  
            <div className="mt-6 space-y-4">
              <MetricProgress
                label={
                  isArabic
                    ? "منشورة"
                    : "Published"
                }
                value={
                  publishedOpportunities
                }
                total={
                  opportunities
                }
              />
  
              <MetricProgress
                label={
                  isArabic
                    ? "بانتظار المراجعة"
                    : "Pending review"
                }
                value={
                  pendingOpportunities
                }
                total={
                  opportunities
                }
              />
            </div>
          </AdminCard>
  
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "الطلبات"
                : "Applications"}
            </p>
  
            <p className="mt-3 text-4xl font-light text-white">
              {
                applicationAcceptanceRate
              }
              %
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? "نسبة القبول"
                : "Acceptance rate"}
            </p>
  
            <div className="mt-6 space-y-4">
              <MetricProgress
                label={
                  isArabic
                    ? "بانتظار المراجعة"
                    : "Pending"
                }
                value={
                  pendingApplications
                }
                total={
                  applications
                }
              />
  
              <MetricProgress
                label={
                  isArabic
                    ? "القائمة المختصرة"
                    : "Shortlisted"
                }
                value={
                  shortlistedApplications
                }
                total={
                  applications
                }
              />
  
              <MetricProgress
                label={
                  isArabic
                    ? "مقبولة"
                    : "Accepted"
                }
                value={
                  acceptedApplications
                }
                total={
                  applications
                }
              />
  
              <MetricProgress
                label={
                  isArabic
                    ? "مرفوضة"
                    : "Rejected"
                }
                value={
                  rejectedApplications
                }
                total={
                  applications
                }
              />
            </div>
          </AdminCard>
        </AdminGrid>
  
        <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label={
              isArabic
                ? "المحادثات"
                : "Conversations"
            }
            value={conversations}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "المحادثات النشطة"
                : "Active conversations"
            }
            value={
              activeConversations
            }
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "الرسائل"
                : "Messages"
            }
            value={messages}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "متوسط الرسائل / محادثة"
                : "Messages / conversation"
            }
            value={
              averageMessagesPerConversation
            }
          />
        </AdminGrid>
  
        <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "كفاءة الفرص"
                : "Opportunity efficiency"}
            </p>
  
            <p className="mt-4 text-4xl font-light text-white">
              {
                averageApplicationsPerOpportunity
              }
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? "متوسط طلبات التقديم لكل فرصة"
                : "Average applications per opportunity"}
            </p>
          </AdminCard>
  
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "الإشعارات"
                : "Notifications"}
            </p>
  
            <p className="mt-4 text-4xl font-light text-white">
              {notifications}
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? `${unreadNotifications} غير مقروء`
                : `${unreadNotifications} unread`}
            </p>
          </AdminCard>
  
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-300/70">
              {isArabic
                ? "البلاغات"
                : "Reports"}
            </p>
  
            <p className="mt-4 text-4xl font-light text-white">
              {reports}
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? `${openReports} تحتاج مراجعة`
                : `${openReports} require review`}
            </p>
          </AdminCard>
  
          <AdminCard>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "نشاط التواصل"
                : "Communication"}
            </p>
  
            <p className="mt-4 text-4xl font-light text-white">
              {messages}
            </p>
  
            <p className="mt-2 text-sm text-white/40">
              {isArabic
                ? `عبر ${conversations} محادثة`
                : `Across ${conversations} conversations`}
            </p>
          </AdminCard>
        </AdminGrid>
  
        <AdminCard>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
                MLAMH
              </p>
  
              <h2 className="mt-2 text-2xl font-light text-white">
                {isArabic
                  ? "مؤشرات التشغيل"
                  : "Operational indicators"}
              </h2>
  
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">
                {isArabic
                  ? "هذه المؤشرات تعتمد على البيانات التشغيلية الحالية في قاعدة البيانات، وستمثل الأساس للمرحلة التالية من التحليلات الزمنية والنمو والتحويل."
                  : "These metrics are calculated from the current operational database and form the basis for growth, time-series, and conversion analytics."
                }
              </p>
            </div>
  
            <div className="grid min-w-[280px] grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs text-white/35">
                  {isArabic
                    ? "قبول الطلبات"
                    : "Application acceptance"}
                </p>
  
                <p className="mt-2 text-xl text-white">
                  {
                    applicationAcceptanceRate
                  }
                  %
                </p>
              </div>
  
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs text-white/35">
                  {isArabic
                    ? "نشر الفرص"
                    : "Opportunity publish rate"}
                </p>
  
                <p className="mt-2 text-xl text-white">
                  {
                    opportunityPublishRate
                  }
                  %
                </p>
              </div>
            </div>
          </div>
        </AdminCard>
      </AdminPageContainer>
    );
  }