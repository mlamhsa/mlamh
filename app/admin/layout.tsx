import { Suspense } from "react";

import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

async function getAdminSidebarCounts() {
  const adminClient = createAdminClient();

  const [
    pendingActionsResult,
    pendingTalentsResult,
    pendingOpportunitiesResult,
    reportedMessagesResult,
    unreadAdminNotificationsResult,
  ] = await Promise.all([
    adminClient
      .from("talent_profile_change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "talent")
      .eq("approval_status", "pending"),
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
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_type", "admin")
      .eq("recipient_id", "admin")
      .eq("is_read", false),
  ]);

  const { data: pendingPublisherProfiles, error: pendingPublisherProfilesError } =
    await adminClient
      .from("profiles")
      .select("id")
      .eq("account_type", "publisher")
      .eq("approval_status", "pending");

  let pendingPublishersCount = 0;

  if (pendingPublisherProfilesError) {
    console.error("[AdminLayout pendingPublisherProfiles]", pendingPublisherProfilesError);
  } else {
    const pendingPublisherProfileIds = (pendingPublisherProfiles ?? [])
      .map((profile) => Number(profile.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (pendingPublisherProfileIds.length > 0) {
      const { count, error } = await adminClient
        .from("publishers")
        .select("id", { count: "exact", head: true })
        .in("profile_id", pendingPublisherProfileIds);

      if (error) {
        console.error("[AdminLayout pendingPublishers]", error);
      } else {
        pendingPublishersCount = count ?? 0;
      }
    }
  }

  if (pendingActionsResult.error) {
    console.error("[AdminLayout pendingActions]", pendingActionsResult.error);
  }
  if (pendingTalentsResult.error) {
    console.error("[AdminLayout pendingTalents]", pendingTalentsResult.error);
  }
  if (pendingOpportunitiesResult.error) {
    console.error("[AdminLayout pendingOpportunities]", pendingOpportunitiesResult.error);
  }
  if (reportedMessagesResult.error) {
    console.error("[AdminLayout reportedMessages]", reportedMessagesResult.error);
  }
  if (unreadAdminNotificationsResult.error) {
    console.error("[AdminLayout unreadAdminNotifications]", unreadAdminNotificationsResult.error);
  }

  return {
    pendingActions:
      (pendingActionsResult.error ? 0 : pendingActionsResult.count ?? 0) +
      (pendingTalentsResult.error ? 0 : pendingTalentsResult.count ?? 0) +
      pendingPublishersCount +
      (pendingOpportunitiesResult.error ? 0 : pendingOpportunitiesResult.count ?? 0),
    pendingPublishers: pendingPublishersCount,
    pendingOpportunities: pendingOpportunitiesResult.error
      ? 0
      : pendingOpportunitiesResult.count ?? 0,
    reportedMessages: reportedMessagesResult.error
      ? 0
      : reportedMessagesResult.count ?? 0,
    unreadAdminNotifications: unreadAdminNotificationsResult.error
      ? 0
      : unreadAdminNotificationsResult.count ?? 0,
  };
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminAccess();
  const counts = await getAdminSidebarCounts();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <Suspense
          fallback={
            <div className="hidden min-h-screen w-[286px] shrink-0 border-e border-white/[0.08] bg-[#080808] lg:block" />
          }
        >
          <AdminSidebar
            counts={{
              pendingActions: counts.pendingActions,
              pendingPublishers: counts.pendingPublishers,
              pendingOpportunities: counts.pendingOpportunities,
              reportedMessages: counts.reportedMessages,
              notifications: counts.unreadAdminNotifications,
            }}
          />
        </Suspense>

        <div className="min-w-0 flex-1">
          <Suspense
            fallback={
              <div className="h-[72px] border-b border-white/[0.08] bg-[#070707]/90" />
            }
          >
            <AdminTopbar unreadAdminNotifications={counts.unreadAdminNotifications} />
          </Suspense>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
