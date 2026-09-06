import Link from "next/link";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingContentAction, requestContentPublishingApprovalAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

const statusLabels: Record<string, { ar: string; en: string }> = {
  idea: { ar: "فكرة", en: "Idea" }, draft: { ar: "مسودة", en: "Draft" }, review: { ar: "مراجعة", en: "Review" },
  ready: { ar: "جاهز للاعتماد", en: "Ready" }, approval: { ar: "بانتظار قرار", en: "Waiting approval" }, scheduled: { ar: "مجدول", en: "Scheduled" }, published: { ar: "منشور", en: "Published" }, measured: { ar: "تم القياس", en: "Measured" },
};
const formatLabels: Record<string, { ar: string; en: string }> = { post: { ar: "منشور", en: "Post" }, feed: { ar: "منشور", en: "Feed" }, reel: { ar: "ريل", en: "Reel" }, story: { ar: "ستوري", en: "Story" }, carousel: { ar: "كاروسيل", en: "Carousel" }, video: { ar: "فيديو", en: "Video" } };
const channelLabels: Record<string, { ar: string; en: string }> = { buffer: { ar: "Instagram + Facebook", en: "Instagram + Facebook" }, instagram: { ar: "Instagram", en: "Instagram" }, facebook: { ar: "Facebook", en: "Facebook" } };

function label(map: Record<string, { ar: string; en: string }>, value: string | null | undefined, ar: boolean) { if (!value) return "—"; const item = map[value]; return item ? (ar ? item.ar : item.en) : value; }
function isAiGenerated(metadata: unknown) { return Boolean(metadata && typeof metadata === "object" && !Array.isArray(metadata) && (metadata as Record<string, unknown>).source === "marketing_ai"); }
function visualRequired(channel: string | null, contentType: string | null) { const c = (channel ?? "").toLowerCase(); const t = (contentType ?? "").toLowerCase(); return c === "instagram" || c === "buffer" || ["reel", "story", "carousel", "video", "image"].includes(t); }
function usableAsset(path: string | null) { return Boolean(path && /^https:\/\//i.test(path)); }

export default async function ContentStudioPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const db = createAdminClient();
  const [{ data, error }, campaignsResult, creativesResult] = await Promise.all([
    db.from("marketing_content").select("id,title,hook,caption,cta,content_type,channel,objective,language,status,scheduled_at,published_at,agent_id,metadata,created_at").order("created_at", { ascending: false }).limit(150),
    db.from("marketing_campaigns").select("id,name,status").in("status", ["draft", "active", "paused"]).order("created_at", { ascending: false }).limit(100),
    db.from("marketing_creatives").select("id,content_id,status,preview_path,storage_path,platform,type,updated_at").order("updated_at", { ascending: false }).limit(500),
  ]);

  const items = data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const creatives = creativesResult.data ?? [];
  const creativeByContent = new Map<number, typeof creatives[number]>();
  for (const creative of creatives) if (creative.content_id && !creativeByContent.has(creative.content_id)) creativeByContent.set(creative.content_id, creative);

  const drafts = items.filter((item) => ["idea", "draft", "review", "ready"].includes(item.status)).length;
  const waiting = items.filter((item) => item.status === "approval").length;
  const scheduled = items.filter((item) => item.status === "scheduled").length;
  const published = items.filter((item) => ["published", "measured"].includes(item.status)).length;
  const waitingCreative = items.filter((item) => { const c = creativeByContent.get(item.id); return visualRequired(item.channel, item.content_type) && !(c && (usableAsset(c.preview_path) || usableAsset(c.storage_path))); }).length;
  const aiDrafts = items.filter((item) => isAiGenerated(item.metadata) && ["draft", "review", "ready"].includes(item.status)).length;

  return <AdminPageContainer>
    <AdminPageHeader eyebrow={isArabic ? "MLAMH · غرفة المحتوى" : "MLAMH · CONTENT ROOM"} title={isArabic ? "استوديو المحتوى" : "Content Studio"} description={isArabic ? "خط إنتاج واضح من النص إلى الكرياتيف ثم الاعتماد والجدولة والنشر." : "A clear pipeline from copy to creative, approval, scheduling and publishing."}/>

    <AdminGrid className="mb-6 md:grid-cols-5">
      <AdminStatCard label={isArabic ? "قيد الإعداد" : "In progress"} value={drafts}/>
      <AdminStatCard label={isArabic ? "ينتظر كرياتيف" : "Waiting creative"} value={waitingCreative}/>
      <AdminStatCard label={isArabic ? "تحتاج قرارك" : "Needs decision"} value={waiting}/>
      <AdminStatCard label={isArabic ? "مجدول" : "Scheduled"} value={scheduled}/>
      <AdminStatCard label={isArabic ? "منشور" : "Published"} value={published}/>
    </AdminGrid>

    <AdminGrid className="mb-6 lg:grid-cols-2">
      <AdminCard className="border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.02] to-transparent p-5"><div className="flex items-center gap-2"><AdminBadge variant="gold">{isArabic ? "إنتاج الفريق" : "TEAM OUTPUT"}</AdminBadge><AdminBadge variant={aiDrafts > 0 ? "success" : "muted"}>{aiDrafts} {isArabic ? "مسودات AI" : "AI drafts"}</AdminBadge></div><h2 className="mt-4 text-xl font-medium text-white">{isArabic ? "قاعدة الجاهزية" : "Readiness rule"}</h2><p className="mt-2 text-sm leading-6 text-white/45">{isArabic ? "المحتوى المرئي لا يصل لاعتمادك قبل وجود أصل صالح. إذا كان الأصل ناقصًا تبقى القطعة بانتظار Sarah بدل إنشاء قرار نشر ناقص." : "Visual content cannot reach approval before a valid asset exists. Missing assets stay with Sarah instead of creating an incomplete publishing decision."}</p></AdminCard>
      <AdminCard className="p-5"><p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/60">{isArabic ? "سياسة النشر" : "PUBLISHING POLICY"}</p><h2 className="mt-2 text-lg font-medium text-white">{isArabic ? "نص → كرياتيف → اعتماد → نشر" : "Copy → Creative → Approval → Publish"}</h2><p className="mt-2 text-sm leading-6 text-white/40">{isArabic ? "Instagram يحتاج أصلًا بصريًا دائمًا. الصيغ المرئية في Facebook تحتاج أصلًا كذلك. البوابة الخلفية تمنع أي Job قديم من تجاوز هذا الشرط." : "Instagram always requires a visual asset. Visual Facebook formats do too. The backend also blocks stale jobs from bypassing this rule."}</p></AdminCard>
    </AdminGrid>

    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر تحميل محتوى الفريق الآن." : "Could not load team content."}</AdminCard> : null}

    <AdminCard className="mb-6 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "خط الإنتاج" : "CONTENT PIPELINE"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "المحتوى الجاري" : "Active content"}</h2></div><p className="text-xs tabular-nums text-white/30">{items.length} {isArabic ? "عنصر" : "items"}</p></div>
      <div className="divide-y divide-white/[0.06]">
        {items.length === 0 ? <div className="p-8 text-center text-sm text-white/40">{isArabic ? "لا يوجد محتوى بعد." : "No content yet."}</div> : items.map((item) => {
          const ai = isAiGenerated(item.metadata);
          const creative = creativeByContent.get(item.id);
          const needsVisual = visualRequired(item.channel, item.content_type);
          const assetReady = Boolean(creative && (usableAsset(creative.preview_path) || usableAsset(creative.storage_path)));
          const blocked = needsVisual && !assetReady;
          return <div key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1.7fr)_.65fr_.65fr_minmax(240px,1fr)] lg:items-center">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-white/85">{item.title ?? item.hook ?? `#${item.id}`}</p>{ai ? <AdminBadge variant="gold">AI</AdminBadge> : null}<AdminBadge variant={item.status === "published" ? "success" : item.status === "approval" ? "warning" : "muted"}>{label(statusLabels, item.status, isArabic)}</AdminBadge>{blocked ? <AdminBadge variant="warning">{isArabic ? "بانتظار التصميم" : "Waiting for creative"}</AdminBadge> : needsVisual ? <AdminBadge variant="success">{isArabic ? "الكرياتيف جاهز" : "Creative ready"}</AdminBadge> : null}</div><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">{item.caption ?? item.hook ?? item.objective ?? "—"}</p><div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/25"><span>#{item.id}</span><span>{item.agent_id ?? "—"}</span>{creative ? <Link href={`/admin/marketing/creative/${creative.id}?lang=${language}`} className="text-gold/60 hover:text-gold">{isArabic ? `فتح كرياتيف #${creative.id}` : `Open creative #${creative.id}`}</Link> : null}</div></div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{isArabic ? "الصيغة" : "Format"}</p><p className="mt-1 text-xs text-white/60">{label(formatLabels, item.content_type, isArabic)}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">{isArabic ? "القناة" : "Channel"}</p><p className="mt-1 text-xs text-white/60">{label(channelLabels, item.channel, isArabic)}</p></div>
            <div>{["draft", "review", "ready"].includes(item.status) ? blocked ? <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3"><p className="text-xs font-medium text-amber-100/80">{isArabic ? "بانتظار Sarah" : "Waiting for Sarah"}</p><p className="mt-1 text-[11px] leading-5 text-white/35">{isArabic ? "لا يمكن إرسال هذه القطعة للاعتماد قبل إرفاق أصل بصري صالح." : "This item cannot be sent for approval until a usable visual asset is attached."}</p><Link href={`/admin/marketing/creative?lang=${language}`} className="mt-2 inline-block text-[11px] text-gold/70">{isArabic ? "فتح Creative Studio ←" : "Open Creative Studio →"}</Link></div> : <form action={requestContentPublishingApprovalAction} className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><input type="hidden" name="content_id" value={item.id}/><p className="mb-2 text-[10px] text-white/35">{isArabic ? "أهداف الاعتماد" : "Approval targets"}</p><div className="mb-2 flex gap-3 text-[11px] text-white/50"><label className="flex items-center gap-1.5"><input type="checkbox" name="targets" value="instagram" defaultChecked={item.channel !== "facebook"}/>Instagram</label><label className="flex items-center gap-1.5"><input type="checkbox" name="targets" value="facebook" defaultChecked={item.channel !== "instagram"}/>Facebook</label></div><button className="w-full rounded-lg border border-gold/25 bg-gold/[0.08] px-3 py-2 text-xs font-medium text-gold">{isArabic ? "إرسال لقراري" : "Send for my decision"}</button></form> : <div className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-3 text-xs text-white/35">{item.status === "approval" ? (isArabic ? "ينتظر قرارك" : "Awaiting decision") : item.status === "scheduled" ? (isArabic ? "مجدول للنشر" : "Scheduled") : (isArabic ? "اكتملت مرحلة النشر" : "Publishing stage complete")}</div>}</div>
          </div>;
        })}
      </div>
    </AdminCard>

    <AdminCard className="p-5"><div className="mb-4"><p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{isArabic ? "إضافة يدوية" : "MANUAL DRAFT"}</p><h2 className="mt-1 text-lg font-medium text-white">{isArabic ? "إنشاء مسودة عند الحاجة" : "Create a manual draft when needed"}</h2></div><form action={createMarketingContentAction} className="grid gap-3 lg:grid-cols-3"><input name="title" placeholder={isArabic ? "عنوان المحتوى" : "Content title"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/><input name="hook" placeholder={isArabic ? "الهوك" : "Hook"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/><select name="content_type" defaultValue="post" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"><option value="post">{isArabic ? "منشور" : "Post"}</option><option value="reel">Reel</option><option value="story">Story</option><option value="carousel">Carousel</option></select><select name="channel" defaultValue="instagram" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="buffer">Instagram + Facebook</option></select><select name="language" defaultValue="ar" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"><option value="ar">العربية</option><option value="en">English</option></select><select name="campaign_id" defaultValue="" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"><option value="">{isArabic ? "بدون حملة" : "No campaign"}</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select><input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white lg:col-span-3"/><textarea name="caption" required rows={5} placeholder={isArabic ? "النص / الكابشن" : "Caption"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white lg:col-span-3"/><input name="cta" placeholder="CTA" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white lg:col-span-2"/><button className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-2.5 text-sm text-gold">{isArabic ? "حفظ المسودة" : "Save draft"}</button></form></AdminCard>
  </AdminPageContainer>;
}
