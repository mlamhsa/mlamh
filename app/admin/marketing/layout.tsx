import { Suspense } from "react";

import { MarketingHubChrome } from "@/components/admin/marketing/MarketingHubChrome";
import { MarketingLiveRefresh } from "@/components/admin/marketing/MarketingLiveRefresh";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MarketingHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMarketingAdminAccess("marketing.view");
  const schedulerConfigured = Boolean(process.env.CRON_SECRET?.trim());
  const db = createAdminClient();
  const nowIso = new Date().toISOString();

  const [approvalCount, overdueFollowups, enrichmentCount, creativeCount, failedJobs, briefsReady] = await Promise.all([
    db.from("marketing_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("marketing_followups").select("id", { count: "exact", head: true }).in("status", ["scheduled", "pending", "due"]).lt("follow_up_at", nowIso),
    db.from("marketing_tasks").select("id", { count: "exact", head: true }).eq("task_type", "lead_enrichment").in("status", ["queued", "scheduled", "running"]),
    db.from("marketing_tasks").select("id", { count: "exact", head: true }).eq("task_type", "creative_brief").in("status", ["queued", "scheduled", "running"]),
    db.from("marketing_channel_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    db.from("marketing_briefs").select("id", { count: "exact", head: true }).eq("status", "complete").is("opportunity_id", null),
  ]);

  const health = {
    approvals: approvalCount.count ?? 0,
    overdue: overdueFollowups.count ?? 0,
    enrichment: enrichmentCount.count ?? 0,
    creative: creativeCount.count ?? 0,
    failed: failedJobs.count ?? 0,
    briefs: briefsReady.count ?? 0,
  };

  return (
    <div className="min-w-0">
      <MarketingLiveRefresh intervalMs={5000} />
      <Suspense
        fallback={
          <div className="mx-4 mt-5 h-28 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:mx-6 sm:mt-6" />
        }
      >
        <MarketingHubChrome
          schedulerConfigured={schedulerConfigured}
          health={health}
        >
          {children}
        </MarketingHubChrome>
      </Suspense>
    </div>
  );
}
