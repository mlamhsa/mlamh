import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingAnalyticsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_events").select("id,event_name,source,medium,campaign,content,entity_type,entity_id,occurred_at").order("occurred_at", { ascending: false }).limit(500);
  const events = data ?? [];
  const count = (name: string) => events.filter((event) => event.event_name === name).length;
  const sources = Array.from(new Set(events.map((event) => event.source).filter(Boolean)));
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "التحليلات والإسناد" : "Analytics & Attribution"} description={isArabic ? "Marketing Events وUTM هي طبقة الإسناد، منفصلة عن Platform Audit Log." : "Marketing Events and UTM form the attribution layer, separate from the platform audit log."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Marketing Events غير مفعلة بعد؛ لن نخترع Attribution." : "Marketing Events are not active yet; attribution will not be fabricated."}</AdminCard> : null}
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label="page_view" value={count("page_view")} /><AdminStatCard label="registration_completed" value={count("registration_completed")} /><AdminStatCard label="application_submitted" value={count("application_submitted")} /><AdminStatCard label="brief_received" value={count("brief_received")} /></AdminGrid>
    <AdminCard className="p-5"><div className="flex items-center justify-between gap-4"><h2 className="text-lg text-white">{isArabic ? "مصادر الإسناد" : "Attribution sources"}</h2><span className="text-xs text-white/35">{events.length} events</span></div><div className="mt-4 flex flex-wrap gap-2">{sources.length === 0 ? <span className="text-sm text-white/40">{isArabic ? "لا توجد بيانات مصدر حتى الآن." : "No source data yet."}</span> : sources.map((source) => <span key={source} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">{source}</span>)}</div></AdminCard>
  </AdminPageContainer>;
}
