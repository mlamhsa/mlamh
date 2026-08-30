import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ExperimentsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_experiments").select("id,name,hypothesis,metric,status,start_at,end_at,winner,result,created_at").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "التجارب" : "Experiments"} description={isArabic ? "A/B tests بسيطة للـHooks وCTA والرسائل والكرياتيف والقنوات بدون منصة إحصائية مبالغ فيها." : "Simple A/B tests for hooks, CTAs, messages, creatives, and channels without over-engineered statistics."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول التجارب غير مفعلة بعد." : "Experiment tables are not active yet."}</AdminCard> : null}
    <div className="grid gap-4">{rows.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد تجارب حقيقية بعد." : "No real experiments yet."}</AdminCard> : rows.map((item) => <AdminCard key={item.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-base text-white">{item.name}</div><div className="mt-1 text-sm text-white/45">{item.hypothesis ?? "—"}</div></div><span className="text-xs text-gold">{item.status}</span></div><div className="mt-4 grid gap-3 text-xs text-white/45 sm:grid-cols-3"><div>Metric<div className="mt-1 text-white/70">{item.metric ?? "—"}</div></div><div>Winner<div className="mt-1 text-white/70">{item.winner ?? "—"}</div></div><div>{isArabic ? "الفترة" : "Window"}<div className="mt-1 text-white/70">{item.start_at ?? "—"} → {item.end_at ?? "—"}</div></div></div></AdminCard>)}</div>
  </AdminPageContainer>;
}
