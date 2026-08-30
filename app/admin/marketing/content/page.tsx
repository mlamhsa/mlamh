import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ContentStudioPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_content").select("id,title,hook,content_type,channel,objective,language,status,scheduled_at,published_at,agent_id,created_at").order("created_at", { ascending: false }).limit(150);
  const items = data ?? [];
  const drafts = items.filter((item) => ["idea","draft","review"].includes(item.status)).length;
  const waiting = items.filter((item) => item.status === "approval").length;
  const scheduled = items.filter((item) => item.status === "scheduled").length;
  const published = items.filter((item) => ["published","measured"].includes(item.status)).length;
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "استوديو المحتوى" : "Content Studio"} description={isArabic ? "Pipeline من الفكرة إلى القياس مع حفظ القناة والهدف واللغة والحملة." : "Pipeline from idea through measurement with channel, objective, language, and campaign context."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Content Studio جاهز معماريًا لكن الجداول غير مفعلة بعد." : "Content Studio architecture is ready, but tables are not active yet."}</AdminCard> : null}
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={isArabic ? "تحت الإعداد" : "In progress"} value={drafts} /><AdminStatCard label={isArabic ? "بانتظار اعتماد" : "Waiting approval"} value={waiting} /><AdminStatCard label={isArabic ? "مجدول" : "Scheduled"} value={scheduled} /><AdminStatCard label={isArabic ? "منشور" : "Published"} value={published} /></AdminGrid>
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{items.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا يوجد محتوى حقيقي بعد." : "No real content records yet."}</div> : items.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.6fr_.8fr_.8fr_.8fr_.8fr]"><div><div className="text-sm text-white">{item.title ?? item.hook ?? `#${item.id}`}</div><div className="mt-1 text-xs text-white/35">{item.objective ?? "—"}</div></div><div className="text-xs text-white/55">{item.content_type}</div><div className="text-xs text-white/55">{item.channel ?? "—"}</div><div className="text-xs text-white/55">{item.agent_id ?? "—"} · {item.language}</div><div className="text-xs text-gold">{item.status}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
