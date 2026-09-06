import Link from "next/link";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; edited?: string }> };

type TaskRow = { id: number; content_id: number | null; task_type: string };
type ApprovalRow = { id: number; task_id: number; status: string };

function statusVariant(status: string) {
  if (status === "approval") return "warning" as const;
  if (status === "ready") return "success" as const;
  if (status === "review") return "gold" as const;
  return "muted" as const;
}

export default async function MarketingContentReviewWorkspace({ searchParams }: PageProps) {
  await requireMarketingAdminAccess("marketing.manage");
  const { lang, edited } = await searchParams;
  const language = getAdminLanguage(lang);
  const ar = language === "ar";
  const db = createAdminClient();

  const { data: contentData, error } = await db.from("marketing_content")
    .select("id,title,hook,caption,cta,content_type,channel,status,language,agent_id,updated_at")
    .not("status", "in", "(published,measured)")
    .order("updated_at", { ascending: false })
    .limit(200);

  const items = contentData ?? [];
  const ids = items.map((item) => item.id);
  const { data: taskData } = ids.length
    ? await db.from("marketing_tasks").select("id,content_id,task_type").in("content_id", ids).eq("task_type", "social_publish")
    : { data: [] as TaskRow[] };
  const tasks = (taskData ?? []) as TaskRow[];
  const taskIds = tasks.map((task) => task.id);
  const { data: approvalData } = taskIds.length
    ? await db.from("marketing_approvals").select("id,task_id,status").in("task_id", taskIds).eq("status", "pending")
    : { data: [] as ApprovalRow[] };
  const approvals = (approvalData ?? []) as ApprovalRow[];
  const approvalByTask = new Map(approvals.map((approval) => [approval.task_id, approval]));
  const approvalByContent = new Map<number, ApprovalRow>();
  for (const task of tasks) {
    const approval = approvalByTask.get(task.id);
    if (task.content_id && approval && !approvalByContent.has(task.content_id)) approvalByContent.set(task.content_id, approval);
  }

  const drafts = items.filter((item) => ["idea", "draft"].includes(item.status)).length;
  const review = items.filter((item) => ["review", "ready"].includes(item.status)).length;
  const waitingApproval = items.filter((item) => item.status === "approval").length;
  const scheduled = items.filter((item) => item.status === "scheduled").length;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={ar ? "MLAMH · مساحة المراجعة" : "MLAMH · REVIEW WORKSPACE"}
      title={ar ? "مراجعة وتحرير المحتوى" : "Content Review & Edit"}
      description={ar ? "مكان واحد لمراجعة كل قطعة قبل النشر: عدّل النص والهوك وCTA، راجع حالتها، ثم انتقل للاعتماد عندما تكون جاهزة." : "One workspace for every pre-publish item: edit copy, hook and CTA, check readiness, then move into approval when ready."}
    />

    {edited ? <AdminCard className="mb-5 border-emerald-400/20 bg-emerald-400/[.04] p-4 text-sm text-emerald-100/70">{ar ? `تم حفظ تعديلات المحتوى #${edited}.` : `Changes saved for content #${edited}.`}</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={ar ? "مسودات" : "Drafts"} value={drafts}/>
      <AdminStatCard label={ar ? "قيد المراجعة" : "In review"} value={review}/>
      <AdminStatCard label={ar ? "بانتظار قرار" : "Waiting approval"} value={waitingApproval}/>
      <AdminStatCard label={ar ? "مجدول" : "Scheduled"} value={scheduled}/>
    </AdminGrid>

    <AdminCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[.07] px-5 py-4"><div><p className="text-[10px] uppercase tracking-[.22em] text-gold/60">PRE-PUBLISH QUEUE</p><h2 className="mt-1 text-lg text-white">{ar ? "كل المحتوى قبل النشر" : "All pre-publish content"}</h2></div><Link href={`/admin/marketing/content?lang=${language}`} className="text-xs text-gold/70">{ar ? "استوديو المحتوى ←" : "Content Studio →"}</Link></div>
      {error ? <div className="p-6 text-sm text-amber-100/70">{ar ? "تعذر تحميل قائمة المحتوى." : "Could not load content queue."}</div> : <div className="divide-y divide-white/[.06]">{items.length === 0 ? <div className="p-8 text-center text-sm text-white/35">{ar ? "لا يوجد محتوى بانتظار المراجعة." : "No content is waiting for review."}</div> : items.map((item) => {
        const approval = approvalByContent.get(item.id);
        const draftEditable = ["idea", "draft", "review", "ready"].includes(item.status);
        return <div key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1.7fr)_.55fr_.55fr_auto] lg:items-center">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-white/85">{item.title ?? item.hook ?? `#${item.id}`}</p><AdminBadge variant={statusVariant(item.status)}>{item.status}</AdminBadge><AdminBadge variant="muted">{item.language ?? "ar"}</AdminBadge></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{item.caption ?? item.hook ?? "—"}</p><p className="mt-2 text-[10px] text-white/25">#{item.id} · {item.agent_id ?? "team"}</p></div>
          <div><p className="text-[9px] uppercase tracking-[.16em] text-white/25">{ar ? "القناة" : "Channel"}</p><p className="mt-1 text-xs text-white/55">{item.channel ?? "—"}</p></div>
          <div><p className="text-[9px] uppercase tracking-[.16em] text-white/25">{ar ? "الصيغة" : "Format"}</p><p className="mt-1 text-xs text-white/55">{item.content_type ?? "—"}</p></div>
          <div className="flex flex-wrap gap-2 lg:justify-end">{draftEditable ? <Link href={`/admin/marketing/content/${item.id}/edit?lang=${language}`} className="rounded-xl border border-gold/20 bg-gold/[.06] px-3 py-2 text-xs font-medium text-gold">{ar ? "تعديل ومراجعة" : "Edit & review"}</Link> : approval ? <Link href={`/admin/marketing/approvals/social/${approval.id}/edit?lang=${language}`} className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] px-3 py-2 text-xs font-medium text-amber-100">{ar ? "تعديل قبل الاعتماد" : "Edit before approval"}</Link> : <Link href={`/admin/marketing/approvals?lang=${language}`} className="rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-xs text-white/60">{ar ? "فتح الاعتمادات" : "Open approvals"}</Link>}</div>
        </div>;
      })}</div>}
    </AdminCard>
  </AdminPageContainer>;
}
