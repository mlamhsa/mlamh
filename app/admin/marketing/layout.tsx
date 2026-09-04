import Link from "next/link";
import { Suspense } from "react";

import { MarketingHubNav } from "@/components/admin/marketing/MarketingHubNav";
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
  const blockers = health.overdue + health.failed;

  return (
    <div className="min-w-0">
      <MarketingLiveRefresh intervalMs={5000} />
      {!schedulerConfigured ? (
        <div className="mx-6 mt-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.045] px-4 py-3 text-xs text-amber-100/75">
          <div>
            <span className="font-medium text-amber-100">Autonomous scheduler · Setup required</span>
            <span className="ms-2 text-amber-100/45">AI tools remain available, but scheduled cycles will stay safely locked until server-side cron authentication is configured.</span>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
        </div>
      ) : null}
      <Suspense
        fallback={
          <div className="mx-6 mt-6 h-14 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
        }
      >
        <div className="px-6 pt-6">
          <MarketingHubNav />
        </div>
      </Suspense>

      <div className="mx-6 mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20">
        <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-3 xl:grid-cols-6">
          <HealthLink href="/admin/marketing/approvals?lang=ar" label="قراراتك" value={health.approvals} accent={health.approvals > 0} />
          <HealthLink href="/admin/marketing/follow-ups?lang=ar" label="متابعات متأخرة" value={health.overdue} danger={health.overdue > 0} />
          <HealthLink href="/admin/marketing/leads?lang=ar" label="تجهيز العملاء" value={health.enrichment} />
          <HealthLink href="/admin/marketing/creative?lang=ar" label="تصاميم قيد الإنتاج" value={health.creative} />
          <HealthLink href="/admin/marketing/social?lang=ar" label="نشر يحتاج إصلاح" value={health.failed} danger={health.failed > 0} />
          <HealthLink href="/admin/marketing/briefs?lang=ar" label="Briefs جاهزة" value={health.briefs} accent={health.briefs > 0} />
        </div>
        <div className={`border-t px-4 py-2.5 text-[11px] ${blockers > 0 ? "border-amber-300/10 bg-amber-300/[0.025] text-amber-100/60" : "border-white/[0.05] text-white/30"}`}>
          {blockers > 0
            ? `الأولوية التشغيلية: معالجة ${blockers} عائق فعلي قبل زيادة حجم المهام.`
            : "لا توجد أعطال نشر أو متابعات متأخرة حاليًا — ركّز على القرارات والمخرجات الجاهزة."}
        </div>
      </div>

      {children}
    </div>
  );
}

function HealthLink({ href, label, value, accent = false, danger = false }: { href: string; label: string; value: number; accent?: boolean; danger?: boolean }) {
  return (
    <Link href={href} className="bg-black/30 px-4 py-3 transition hover:bg-white/[0.025]">
      <p className="text-[10px] text-white/35">{label}</p>
      <p className={`mt-1 text-xl ${danger ? "text-red-100" : accent ? "text-gold" : "text-white/80"}`}>{value}</p>
    </Link>
  );
}