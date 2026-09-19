import { Suspense } from "react";

import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getUserPermissions } from "@/lib/rbac/helpers";
import type { Permission } from "@/lib/rbac/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminLayoutProps = {
  children: React.ReactNode;
};

async function getAdminSidebarCounts() {
  const adminClient = createAdminClient();

  const [
    pendingTalentChangesResult,
    pendingTalentsResult,
    pendingPublisherVerificationsResult,
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

  let pendingPublisherApprovals = 0;

  if (pendingPublisherProfilesError) {
    console.error(
      "[AdminLayout pendingPublisherProfiles]",
      pendingPublisherProfilesError,
    );
  } else {
    const profileIds = (pendingPublisherProfiles ?? [])
      .map((profile) => Number(profile.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (profileIds.length > 0) {
      const { count, error } = await adminClient
        .from("publishers")
        .select("id", { count: "exact", head: true })
        .in("profile_id", profileIds);

      if (error) {
        console.error("[AdminLayout pendingPublishers]", error);
      } else {
        pendingPublisherApprovals = count ?? 0;
      }
    }
  }

  const results = [
    ["pendingTalentChanges", pendingTalentChangesResult.error],
    ["pendingTalents", pendingTalentsResult.error],
    ["pendingPublisherVerifications", pendingPublisherVerificationsResult.error],
    ["pendingOpportunities", pendingOpportunitiesResult.error],
    ["reportedMessages", reportedMessagesResult.error],
    ["unreadAdminNotifications", unreadAdminNotificationsResult.error],
  ] as const;

  for (const [label, error] of results) {
    if (error) {
      console.error(`[AdminLayout ${label}]`, error);
    }
  }

  const pendingTalentChanges = pendingTalentChangesResult.error
    ? 0
    : pendingTalentChangesResult.count ?? 0;
  const pendingTalents = pendingTalentsResult.error
    ? 0
    : pendingTalentsResult.count ?? 0;
  const pendingPublisherVerifications = pendingPublisherVerificationsResult.error
    ? 0
    : pendingPublisherVerificationsResult.count ?? 0;
  const pendingOpportunities = pendingOpportunitiesResult.error
    ? 0
    : pendingOpportunitiesResult.count ?? 0;
  const reportedMessages = reportedMessagesResult.error
    ? 0
    : reportedMessagesResult.count ?? 0;
  const unreadAdminNotifications = unreadAdminNotificationsResult.error
    ? 0
    : unreadAdminNotificationsResult.count ?? 0;

  return {
    pendingActions:
      pendingTalentChanges +
      pendingTalents +
      pendingPublisherApprovals +
      pendingPublisherVerifications +
      pendingOpportunities +
      reportedMessages,
    pendingPublishers: pendingPublisherApprovals + pendingPublisherVerifications,
    pendingOpportunities,
    reportedMessages,
    unreadAdminNotifications,
  };
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const currentAdmin = await requireAdminAccess();

  let permissions: Permission[] = [];

  try {
    permissions = await getUserPermissions(currentAdmin.id);
  } catch (permissionError) {
    console.error("[AdminLayout permissions]", permissionError);
  }

  const counts = await getAdminSidebarCounts();
  const navigationCounts = {
    pendingActions: counts.pendingActions,
    pendingPublishers: counts.pendingPublishers,
    pendingOpportunities: counts.pendingOpportunities,
    reportedMessages: counts.reportedMessages,
    notifications: counts.unreadAdminNotifications,
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-screen">
        <Suspense
          fallback={
            <div className="hidden min-h-screen w-[272px] shrink-0 border-e border-white/[0.07] bg-[#080808] lg:block" />
          }
        >
          <AdminSidebar
            counts={navigationCounts}
            permissions={permissions}
            adminEmail={currentAdmin.email}
          />
        </Suspense>

        <div className="min-w-0 flex-1">
          <Suspense
            fallback={
              <div className="h-16 border-b border-white/[0.065] bg-[#070707]/92" />
            }
          >
            <AdminTopbar
              counts={navigationCounts}
              unreadAdminNotifications={counts.unreadAdminNotifications}
              permissions={permissions}
              adminEmail={currentAdmin.email}
            />
          </Suspense>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
