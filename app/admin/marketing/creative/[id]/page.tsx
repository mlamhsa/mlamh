import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };
function statusLabel(value: string | null, ar: boolean) { if (!value) return "—"; if (!ar) return value.replaceAll("_", " "); return ({ draft: "مسودة", ready: "جاهز للمراجعة", approved: "معتمد", published: "منشور", archived: "مؤرشف", approval: "بانتظار قرار", scheduled: "مجدول", failed: "فشل" } as Record<string,string>)[value] ?? value.replaceAll("_", " "); }

export default async function CreativeWorkspacePage({ params, searchParams }: PageProps) {
  await requireAdminAccess();
  const [{ id }, { lang }] = await Promise.all([params, searchParams]);
  const creativeId = Number(id);
  if (!Number.isInteger(creativeId) || creativeId <= 0) notFound();
  const language = getAdminLanguage(lang);
  const ar = language === "ar";
  const db = createAdminClient();
  const creativeResult = await db.from("marketing_creatives").select("id,content_id,campaign_id,type,platform,aspect_ratio,status,storage_path,preview_path,created_by_agent_id,version,created_at").eq("id", creativeId).maybeSingle();
  const creative = creativeResult.data;
  if (!creative) notFound();
  const [contentResult, campaignResult, jobsResult] = await Promise.all([
    creative.content_id ? db.from("marketing_content").select("id,title,hook,caption,cta,content_type,channel,status,scheduled_at,published_at,agent_id,campaign_id").eq("id", creative.content_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    creative.campaign_id ? db.from("marketing_campaigns").select("id,name,status,objective").eq("id", creative.campaign_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    creative.content_id ? db.from("marketing_channel_jobs").select("id,channel,status,scheduled_at,published_at,last_error,external_post_id").eq("content_id", creative.content_id).order("created_at", { ascending: false }).limit(30) : Promise.resolve({ data: [], error: null }),
  ]);
  const content = contentResult.data;
  const campaign = campaignResult.data;
  const jobs = jobsResult.data ?? [];
  const attention = jobs.filter((job) => ["failed", "waiting_approval"].includes(job.status)).length;
  const published = jobs.filter((job) => job.status === "published").length;

  return <AdminPageContainer>
    <div className="mb-4"><Link href={`/admin/marketing/creative?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">{ar ? "← العودة إلى Creative Studio" : "← Back to Creative Studio"}</Link></div>
    <AdminPageHeader eyebrow={ar ? "MLAMH · مساحة عمل الكرياتيف" : "MLAMH · CREATIVE WORKSPACE"} title={`${ar ? "كرياتيف" : "Creative"} #${creative.id}`} description={ar ? "راجع الأصل الإبداعي مع سياقه: المحتوى، الحملة، حالة النشر، وما يحتاج تدخلًا." : "Review the creative asset with its content, campaign, publishing state, and required actions."} />
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={ar ? "الحالة" : "Status"} value={statusLabel(creative.status, ar)}/><AdminStatCard label={ar ? "الإصدار" : "Version"} value={creative.version}/><AdminStatCard label={ar ? "منشور" : "Published jobs"} value={published}/><AdminStatCard label={ar ? "يحتاج انتباه" : "Needs attention"} value={attention}/></AdminGrid>
    <AdminCard className="mb-6 overflow-hidden"><div className="flex min-h-64 items-center justify-center border-b border-white/[0.07] bg-gradient-to-br from-white/[0.04] via-gold/[0.04] to-black/30"><div className="text-center"><p className="text-4xl font-light text-white/20">{creative.aspect_ratio ?? "—"}</p><p className="mt-3 text-xs uppercase tracking-[0.2em] text-gold/50">{creative.platform ?? "MLAMH"} · {creative.type}</p></div></div><div className="p-5"><div className="flex flex-wrap items-center gap-2"><AdminBadge variant={["ready","approved","published"].includes(creative.status) ? "success" : "muted"}>{statusLabel(creative.status, ar)}</AdminBadge><AdminBadge variant="muted">v{creative.version}</AdminBadge>{creative.created_by_agent_id ? <AdminBadge variant="gold">{creative.created_by_agent_id}</AdminBadge> : null}</div><div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-white/30">{ar ? "المنصة" : "Platform"}</p><p className="mt-1 text-white/70">{creative.platform ?? "—"}</p></div><div><p className="text-white/30">{ar ? "المقاس" : "Aspect ratio"}</p><p className="mt-1 text-white/70">{creative.aspect_ratio ?? "—"}</p></div><div><p className="text-white/30">{ar ? "المحتوى" : "Content"}</p><p className="mt-1 text-white/70">{content?.title ?? content?.hook ?? (creative.content_id ? `#${creative.content_id}` : "—")}</p></div><div><p className="text-white/30">{ar ? "الحملة" : "Campaign"}</p><p className="mt-1 text-white/70">{campaign?.name ?? (creative.campaign_id ? `#${creative.campaign_id}` : "—")}</p></div></div></div></AdminCard>
    <div className="grid gap-5 xl:grid-cols-2"><AdminCard className="p-5"><h2 className="text-base text-white">{ar ? "المحتوى المرتبط" : "Linked content"}</h2>{content ? <><p className="mt-3 text-sm font-medium text-white/75">{content.title ?? content.hook ?? `#${content.id}`}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/50">{content.caption ?? content.hook ?? "—"}</p><div className="mt-4 flex flex-wrap gap-2"><AdminBadge variant={content.status === "published" ? "success" : content.status === "approval" ? "warning" : "muted"}>{statusLabel(content.status, ar)}</AdminBadge>{content.channel ? <AdminBadge variant="muted">{content.channel}</AdminBadge> : null}</div><Link href={`/admin/marketing/content?lang=${language}`} className="mt-4 inline-block text-xs text-gold/70 hover:text-gold">{ar ? "فتح استوديو المحتوى ←" : "Open Content Studio →"}</Link></> : <p className="mt-3 text-sm text-white/35">{ar ? "لا يوجد محتوى مرتبط." : "No linked content."}</p>}</AdminCard><AdminCard className="p-5"><h2 className="text-base text-white">{ar ? "الحملة" : "Campaign"}</h2>{campaign ? <><p className="mt-3 text-sm font-medium text-white/75">{campaign.name}</p><p className="mt-2 text-sm leading-6 text-white/45">{campaign.objective ?? "—"}</p><Link href={`/admin/marketing/campaigns/${campaign.id}?lang=${language}`} className="mt-4 inline-block rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold">{ar ? "فتح مساحة الحملة" : "Open campaign workspace"}</Link></> : <p className="mt-3 text-sm text-white/35">{ar ? "هذا الأصل غير مرتبط بحملة." : "This asset is not linked to a campaign."}</p>}</AdminCard></div>
    <AdminCard className="mt-5 overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar ? "حالة النشر" : "Publishing state"}</h2><Link href={`/admin/marketing/social?lang=${language}${campaign?.id ? `&campaign_id=${campaign.id}` : ""}`} className="text-xs text-gold/70">{ar ? "فتح المجدول ←" : "Open scheduler →"}</Link></div><div className="divide-y divide-white/[0.06]">{jobs.length === 0 ? <div className="p-5 text-sm text-white/35">{ar ? "لا توجد عمليات نشر مرتبطة بهذا المحتوى." : "No publishing jobs linked to this content."}</div> : jobs.map((job) => <div key={job.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_.7fr_1fr]"><div className="text-sm text-white/70">{job.channel}</div><div className="text-xs text-gold/70">{statusLabel(job.status, ar)}</div><div className="text-xs text-white/35">{job.scheduled_at ? new Date(job.scheduled_at).toLocaleString(ar ? "ar-SA" : "en-US") : job.published_at ? new Date(job.published_at).toLocaleString(ar ? "ar-SA" : "en-US") : "—"}{job.last_error ? <p className="mt-1 text-red-200/70">{job.last_error}</p> : null}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
