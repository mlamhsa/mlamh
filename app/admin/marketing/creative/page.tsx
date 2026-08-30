import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function CreativeStudioPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_creatives").select("id,content_id,campaign_id,type,platform,aspect_ratio,status,storage_path,preview_path,created_by_agent_id,version,created_at").order("created_at", { ascending: false }).limit(150);
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "الاستوديو الإبداعي" : "Creative Studio"} description={isArabic ? "إدارة ملفات الكرياتيف والنسخ والإصدارات، بدون محاولة بناء محرر Canva داخل ملامح." : "Manage creative assets, variants, and versions without rebuilding Canva inside MLAMH."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Creative Studio غير مفعّل بعد." : "Creative Studio tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد ملفات Creative حقيقية بعد." : "No real creative assets yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_.8fr_.8fr_.7fr_.6fr]"><div className="text-sm text-white">{item.type}</div><div className="text-xs text-white/55">{item.platform ?? "—"}</div><div className="text-xs text-white/55">{item.aspect_ratio ?? "—"}</div><div className="text-xs text-gold">{item.status}</div><div className="text-xs text-white/45">v{item.version}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
