import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeScheduledChannelJobAction, publishChannelJobNowAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

const lifecycle = ["Draft", "Waiting Approval", "Approved", "Ready to Publish", "Publishing", "Published / Failed"];

function displayState(status: string) {
  if (status === "approved") return "Ready to Publish";
  if (status === "scheduled") return "Approved · Scheduled";
  if (status === "publishing") return "Publishing";
  if (status === "published") return "Published";
  if (status === "failed") return "Failed";
  if (status === "waiting_approval") return "Waiting Approval";
  return status;
}

export default async function SocialPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_channel_jobs").select("id,content_id,task_id,approval_id,channel,status,scheduled_at,published_at,external_post_id,retry_count,last_error,payload,created_at").order("created_at", { ascending: false }).limit(150);
  const rows = data ?? [];

  return <AdminPageContainer>
    <AdminPageHeader title="Social Scheduler" description={isArabic ? "الاعتماد لا ينشر تلقائيًا. كل Target له Job مستقل، والتنفيذ صريح ومحمي بالاعتماد وKill Switch وIdempotency." : "Approval never auto-publishes. Every target has an independent job and execution is explicitly gated by approval, kill switch, and idempotency."} />
    <AdminCard className="mb-5 p-4"><div className="flex flex-wrap items-center gap-2">{lifecycle.map((step, index) => <div key={step} className="flex items-center gap-2"><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60">{step}</span>{index < lifecycle.length - 1 ? <span className="text-white/20">→</span> : null}</div>)}</div></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Scheduler غير متاح." : "Scheduler is unavailable."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد Channel Jobs حقيقية بعد." : "No real channel jobs yet."}</div> : rows.map((item) => {
      const payload = item.payload && typeof item.payload === "object" && !Array.isArray(item.payload) ? item.payload as Record<string, unknown> : {};
      const target = typeof payload.target === "string" ? payload.target : "—";
      return <div key={item.id} className="grid gap-3 px-5 py-4 xl:grid-cols-[1.1fr_.7fr_.9fr_.7fr_1.2fr]">
        <div><div className="text-sm text-white">Job #{item.id} · {target}</div><div className="mt-1 text-xs text-white/35">Content #{item.content_id ?? "—"} · Approval #{item.approval_id ?? "—"}</div></div>
        <div className="text-xs text-white/55">{item.channel}</div>
        <div><div className="text-xs text-gold">{displayState(item.status)}</div><div className="mt-1 text-[11px] text-white/35">Retry {item.retry_count}</div></div>
        <div className="text-xs text-white/35">{item.scheduled_at ?? item.published_at ?? "—"}<div className="mt-1 break-all text-emerald-300/60">{item.external_post_id ?? ""}</div><div className="mt-1 text-red-300/70">{item.last_error ?? ""}</div></div>
        <div className="flex flex-wrap items-start gap-2">{item.status === "approved" || item.status === "failed" ? <form action={publishChannelJobNowAction}><input type="hidden" name="job_id" value={item.id}/><button className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">{isArabic ? "نشر الآن" : "Publish now"}</button></form> : null}{item.status === "scheduled" ? <form action={executeScheduledChannelJobAction}><input type="hidden" name="job_id" value={item.id}/><button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">{isArabic ? "تنفيذ الجدولة" : "Execute schedule"}</button></form> : null}</div>
      </div>;
    })}</div></AdminCard>
  </AdminPageContainer>;
}
