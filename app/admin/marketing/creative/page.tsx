import Link from "next/link";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; campaign_id?: string }> };

function statusLabel(value: string, ar: boolean) {
  const map: Record<string, [string, string]> = {
    draft: ["مسودة", "Draft"], ready: ["جاهز للمراجعة", "Ready for review"], approved: ["معتمد", "Approved"],
    published: ["منشور", "Published"], archived: ["مؤرشف", "Archived"], revision: ["يحتاج تعديل", "Needs revision"],
  };
  return map[value]?.[ar ? 0 : 1] ?? value.replaceAll("_", " ");
}

function typeLabel(value: string, ar: boolean) {
  const map: Record<string, [string, string]> = {
    image: ["صورة", "Image"], video: ["فيديو", "Video"], story: ["ستوري", "Story"], reel: ["ريلز", "Reel"], carousel: ["كاروسيل", "Carousel"], post: ["منشور", "Post"],
  };
  return map[value]?.[ar ? 0 : 1] ?? value;
}

function usablePreview(previewPath: string | null, storagePath: string | null) {
  const value = previewPath || storagePath || "";
  return /^https:\/\//i.test(value) ? value : null;
}

function isVideo(type: string, url: string | null) {
  return type === "video" || type === "reel" || Boolean(url && /\.(mp4|webm|mov)(\?|$)/i.test(url));
}

export default async function CreativeStudioPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, campaign_id } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const requestedCampaignId = Number(campaign_id);
  const selectedCampaignId = Number.isInteger(requestedCampaignId) && requestedCampaignId > 0 ? requestedCampaignId : null;
  const db = createAdminClient();

  let query = db.from("marketing_creatives").select("id,content_id,campaign_id,type,platform,aspect_ratio,status,storage_path,preview_path,created_by_agent_id,version,created_at").order("created_at", { ascending: false }).limit(150);
  if (selectedCampaignId) query = query.eq("campaign_id", selectedCampaignId);

  const [{ data, error }, campaignsResult] = await Promise.all([
    query,
    db.from("marketing_campaigns").select("id,name,status").order("created_at", { ascending: false }).limit(100),
  ]);

  const rows = data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const campaignNames = new Map(campaigns.map((item) => [item.id, item.name]));
  const selectedCampaign = selectedCampaignId ? campaigns.find((item) => item.id === selectedCampaignId) ?? null : null;
  const ready = rows.filter((item) => ["ready", "approved"].includes(item.status)).length;
  const published = rows.filter((item) => item.status === "published").length;
  const drafts = rows.filter((item) => item.status === "draft").length;
  const withAsset = rows.filter((item) => usablePreview(item.preview_path, item.storage_path)).length;
  const missingAsset = rows.length - withAsset;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={isArabic ? "MLAMH · الإنتاج الإبداعي" : "MLAMH · CREATIVE PRODUCTION"}
      title="Creative Studio"
      description={isArabic ? "استوديو إنتاج حقيقي: شاهد الأصل نفسه، حالة جاهزيته، الحملة والمحتوى المرتبط قبل أن يصل للنشر." : "A real production workspace: see the actual asset, readiness, campaign and linked content before publishing."}
    />

    {selectedCampaign ? <AdminCard className="mb-5 border-gold/20 bg-gold/[0.05] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-gold/60">{isArabic ? "كرياتيف الحملة المحددة" : "SELECTED CAMPAIGN CREATIVE"}</p><p className="mt-1 text-sm font-medium text-white">{selectedCampaign.name}</p></div><div className="flex gap-2"><Link href={`/admin/marketing/campaigns/${selectedCampaign.id}?lang=${language}`} className="rounded-lg border border-gold/25 px-3 py-2 text-xs text-gold">{isArabic ? "مساحة الحملة" : "Campaign workspace"}</Link><Link href={`/admin/marketing/creative?lang=${language}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">{isArabic ? "عرض الكل" : "Show all"}</Link></div></div></AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-5">
      <AdminStatCard label={isArabic ? "مسودات" : "Drafts"} value={drafts}/>
      <AdminStatCard label={isArabic ? "جاهز للمراجعة" : "Ready"} value={ready}/>
      <AdminStatCard label={isArabic ? "بأصل مرئي" : "With asset"} value={withAsset}/>
      <AdminStatCard label={isArabic ? "ينتظر أصلًا" : "Missing asset"} value={missingAsset}/>
      <AdminStatCard label={isArabic ? "منشور" : "Published"} value={published}/>
    </AdminGrid>

    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر تحميل ملفات Creative Studio." : "Creative Studio data is unavailable."}</AdminCard> : null}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.length === 0 ? <AdminCard className="p-6 md:col-span-2 xl:col-span-3"><p className="text-sm text-white/60">{selectedCampaign ? (isArabic ? "لا توجد أصول إبداعية مرتبطة بهذه الحملة بعد." : "No creative assets linked to this campaign yet.") : (isArabic ? "لا توجد أصول إبداعية بعد." : "No creative assets yet.")}</p></AdminCard> : rows.map((item) => {
        const preview = usablePreview(item.preview_path, item.storage_path);
        const video = isVideo(item.type, preview);
        return <AdminCard key={item.id} className="overflow-hidden">
          <Link href={`/admin/marketing/creative/${item.id}?lang=${language}`} className="block">
            <div className="relative aspect-[16/9] overflow-hidden border-b border-white/[0.06] bg-black/30">
              {preview ? video ? <video src={preview} muted playsInline preload="metadata" className="h-full w-full object-cover"/> : <img src={preview} alt={`${typeLabel(item.type, isArabic)} #${item.id}`} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-white/[0.04] to-gold/[0.035]"><div className="text-center"><p className="text-2xl text-white/20">{item.aspect_ratio || "—"}</p><p className="mt-2 text-[10px] uppercase tracking-[.18em] text-amber-200/60">{isArabic ? "بانتظار الأصل المرئي" : "WAITING FOR ASSET"}</p></div></div>}
              <div className="absolute left-3 top-3"><AdminBadge variant={preview ? "success" : "warning"}>{preview ? (isArabic ? "أصل موجود" : "Asset ready") : (isArabic ? "بدون أصل" : "No asset")}</AdminBadge></div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white hover:text-gold">{typeLabel(item.type, isArabic)}</p><p className="mt-1 text-xs text-white/35">{item.platform || "—"} · {item.aspect_ratio || "—"}</p>{item.campaign_id ? <p className="mt-2 text-[11px] text-gold/55">{campaignNames.get(item.campaign_id) ?? `Campaign #${item.campaign_id}`}</p> : null}</div><AdminBadge variant={["ready", "approved", "published"].includes(item.status) ? "success" : "muted"}>{statusLabel(item.status, isArabic)}</AdminBadge></div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-white/30"><span>{isArabic ? "الإصدار" : "Version"} {item.version}</span><span className="text-gold/70">{isArabic ? "فتح الأصل ←" : "Open asset →"}</span></div>
            </div>
          </Link>
        </AdminCard>;
      })}
    </div>
  </AdminPageContainer>;
}
