import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function OpportunityGrowthPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ count: opportunities }, { count: published }, { count: applications }, { data: opportunityRows }] = await Promise.all([
    db.from("opportunities").select("id", { count: "exact", head: true }),
    db.from("opportunities").select("id", { count: "exact", head: true }).eq("published", true),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }),
    db.from("opportunities").select("id,title,opportunity_type,city_ar,city_en,published,created_at").order("created_at", { ascending: false }).limit(30),
  ]);
  const total = opportunities ?? 0;
  const publishedCount = published ?? 0;
  const applicationCount = applications ?? 0;
  const avg = publishedCount > 0 ? (applicationCount / publishedCount).toFixed(1) : "0.0";

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "نمو الفرص" : "Opportunity Growth"} description={isArabic ? "قراءة سيولة السوق: الفرص المنشورة، الطلبات ومتوسط الطلبات لكل فرصة." : "Marketplace liquidity view: published opportunities, applications, and applications per opportunity."} />
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={isArabic ? "إجمالي الفرص" : "Opportunities"} value={total} /><AdminStatCard label={isArabic ? "منشورة" : "Published"} value={publishedCount} /><AdminStatCard label={isArabic ? "طلبات" : "Applications"} value={applicationCount} /><AdminStatCard label={isArabic ? "طلبات/فرصة" : "Applications / Opportunity"} value={avg} /></AdminGrid>
    <AdminCard className="overflow-hidden"><div className="border-b border-white/10 px-5 py-4 text-sm text-white/60">{isArabic ? "أحدث الفرص" : "Latest opportunities"}</div><div className="divide-y divide-white/[0.07]">{(opportunityRows ?? []).map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.6fr_.8fr_.8fr_.6fr]"><div className="text-sm text-white">{item.title}</div><div className="text-xs text-white/50">{item.opportunity_type}</div><div className="text-xs text-white/50">{isArabic ? (item.city_ar ?? "—") : (item.city_en ?? item.city_ar ?? "—")}</div><div className={item.published ? "text-xs text-gold" : "text-xs text-white/35"}>{item.published ? (isArabic ? "منشورة" : "Published") : (isArabic ? "غير منشورة" : "Unpublished")}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
