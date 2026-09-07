import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

type SupplyGap = { needed: number; available: number; missing: number; reasons: string[] };

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function supplyGapFromMetadata(value: unknown): SupplyGap | null {
  const gap = record(record(value).talent_supply_gap);
  const needed = Number(gap.needed);
  const available = Number(gap.available);
  const missing = Number(gap.missing);
  if (![needed, available, missing].every(Number.isFinite)) return null;
  return {
    needed: Math.max(0, needed),
    available: Math.max(0, available),
    missing: Math.max(0, missing),
    reasons: Array.isArray(gap.reasons) ? gap.reasons.filter((item): item is string => typeof item === "string").slice(0, 6) : [],
  };
}

export default async function OpportunityGrowthPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [opportunitiesResult, publishedResult, applicationsResult, opportunityRowsResult, sharesResult, referredViewsResult, whatsappSharesResult, nativeSharesResult, copiedSharesResult, briefsResult] = await Promise.all([
    db.from("opportunities").select("id", { count: "exact", head: true }),
    db.from("opportunities").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }),
    db.from("opportunities").select("id,title,opportunity_type,city_ar,city_en,published,created_at").order("created_at", { ascending: false }).limit(30),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_shared").gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_viewed").contains("metadata", { acquisition_source: "opportunity_share" }).gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_shared").contains("metadata", { share_channel: "whatsapp" }).gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_shared").contains("metadata", { share_channel: "native" }).gte("created_at", since),
    db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_shared").contains("metadata", { share_channel: "copy_link" }).gte("created_at", since),
    db.from("marketing_briefs").select("id,talent_type,talent_count,city,status,metadata,created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const total = opportunitiesResult.count ?? 0;
  const publishedCount = publishedResult.count ?? 0;
  const applicationCount = applicationsResult.count ?? 0;
  const avg = publishedCount > 0 ? (applicationCount / publishedCount).toFixed(1) : "0.0";
  const shares = sharesResult.count ?? 0;
  const referredViews = referredViewsResult.count ?? 0;
  const viewsPerShare = shares > 0 ? (referredViews / shares).toFixed(1) : "0.0";
  const supplyBriefs = (briefsResult.data ?? []).map((brief) => ({ ...brief, gap: supplyGapFromMetadata(brief.metadata) })).filter((brief) => brief.gap !== null);
  const briefsWithGap = supplyBriefs.filter((brief) => (brief.gap?.missing ?? 0) > 0);
  const totalMissingSupply = briefsWithGap.reduce((sum, brief) => sum + (brief.gap?.missing ?? 0), 0);

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "نمو الفرص" : "Opportunity Growth"} description={isArabic ? "قراءة سيولة السوق: الفرص والطلبات، نمو المشاركة العضوية، وفجوات العرض المؤهلة التي حسبتها Dana بالفعل." : "Marketplace liquidity: opportunities and applications, organic sharing growth, and qualified supply gaps already calculated by Dana."} />

    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={isArabic ? "إجمالي الفرص" : "Opportunities"} value={total} /><AdminStatCard label={isArabic ? "منشورة" : "Published"} value={publishedCount} /><AdminStatCard label={isArabic ? "طلبات" : "Applications"} value={applicationCount} /><AdminStatCard label={isArabic ? "طلبات/فرصة" : "Applications / Opportunity"} value={avg} /></AdminGrid>

    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg text-white">{isArabic ? "حلقة مشاركة الفرص" : "Opportunity sharing loop"}</h2><p className="mt-1 text-xs leading-5 text-white/35">{isArabic ? "من الآن، روابط المشاركة تحمل Attribution داخليًا لتمييز الزيارات القادمة من مشاركة فرصة. لا نعتبر الضغط على WhatsApp وصولًا مؤكدًا؛ الزيارة المنسوبة تُسجل فقط عند فتح الرابط في ملامح." : "Shared links now carry first-party attribution. A WhatsApp click is not treated as a confirmed visit; an attributed visit is recorded only when the shared MLAMH link is opened."}</p></div><AdminBadge variant="muted">7D</AdminBadge></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "مشاركات" : "Shares"}</div><div className="mt-2 text-2xl font-semibold text-white">{shares}</div></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "زيارات من مشاركة" : "Referred views"}</div><div className="mt-2 text-2xl font-semibold text-white">{referredViews}</div></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "زيارة/مشاركة" : "Views / share"}</div><div className="mt-2 text-2xl font-semibold text-white">{viewsPerShare}</div></div></div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs"><AdminBadge variant="muted">WhatsApp {whatsappSharesResult.count ?? 0}</AdminBadge><AdminBadge variant="muted">Native {nativeSharesResult.count ?? 0}</AdminBadge><AdminBadge variant="muted">Copy {copiedSharesResult.count ?? 0}</AdminBadge></div>
      </AdminCard>

      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg text-white">{isArabic ? "فجوة العرض المؤهل" : "Qualified supply gap"}</h2><p className="mt-1 text-xs leading-5 text-white/35">{isArabic ? "نقرأ نتائج المطابقة المخزنة من Dana بدل إعادة تحميل كل المواهب أو بناء Matching ثانٍ داخل Marketing Hub." : "Uses Dana's persisted matching results rather than loading the full talent table again or creating a second matching engine in Marketing Hub."}</p></div><AdminBadge variant={briefsWithGap.length > 0 ? "warning" : "success"}>{briefsWithGap.length > 0 ? (isArabic ? "تحتاج نمو عرض" : "SUPPLY NEEDED") : (isArabic ? "لا فجوة مسجلة" : "NO RECORDED GAP")}</AdminBadge></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "بريفات بفجوة" : "Briefs with gap"}</div><div className="mt-2 text-2xl font-semibold text-white">{briefsWithGap.length}</div></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="text-xs text-white/35">{isArabic ? "مواهب ناقصة" : "Missing talent"}</div><div className="mt-2 text-2xl font-semibold text-white">{totalMissingSupply}</div></div></div>
      </AdminCard>
    </div>

    {supplyBriefs.length > 0 ? <AdminCard className="mb-6 overflow-hidden"><div className="border-b border-white/10 px-5 py-4"><div className="text-sm text-white/60">{isArabic ? "أحدث إشارات العرض من Dana" : "Latest Dana supply signals"}</div><div className="mt-1 text-xs text-white/30">{isArabic ? "هذه الأرقام هي Snapshot وقت معالجة البريف؛ لا ندعي أنها Live إذا لم يُعاد تشغيل المطابقة." : "These are snapshots from brief processing; they are not presented as live if matching has not been rerun."}</div></div><div className="divide-y divide-white/[0.07]">{supplyBriefs.slice(0, 10).map((brief) => <div key={brief.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.6fr_1fr_.8fr_.65fr_.65fr]"><div className="text-xs text-white/40">#{brief.id}</div><div className="text-sm text-white">{brief.talent_type ?? "—"}</div><div className="text-xs text-white/50">{brief.city ?? "—"}</div><div className="text-xs text-white/55">{isArabic ? "متاح" : "Available"}: {brief.gap?.available ?? 0}/{brief.gap?.needed ?? 0}</div><div className={(brief.gap?.missing ?? 0) > 0 ? "text-xs text-amber-200" : "text-xs text-emerald-200"}>{isArabic ? "ناقص" : "Missing"}: {brief.gap?.missing ?? 0}</div></div>)}</div></AdminCard> : null}

    <AdminCard className="overflow-hidden"><div className="border-b border-white/10 px-5 py-4 text-sm text-white/60">{isArabic ? "أحدث الفرص" : "Latest opportunities"}</div><div className="divide-y divide-white/[0.07]">{(opportunityRowsResult.data ?? []).map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.6fr_.8fr_.8fr_.6fr]"><div className="text-sm text-white">{item.title}</div><div className="text-xs text-white/50">{item.opportunity_type}</div><div className="text-xs text-white/50">{isArabic ? (item.city_ar ?? "—") : (item.city_en ?? item.city_ar ?? "—")}</div><div className={item.published ? "text-xs text-gold" : "text-xs text-white/35"}>{item.published ? (isArabic ? "منشورة" : "Published") : (isArabic ? "غير منشورة" : "Unpublished")}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
