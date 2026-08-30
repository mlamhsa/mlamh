import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function SocialPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_content").select("id,title,channel,status,scheduled_at,published_at,external_post_id").in("status", ["approval","scheduled","published","measured"]).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(100);
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "Social Scheduler" : "Social Scheduler"} description={isArabic ? "واجهة الجدولة تعتمد على Content Pipeline وChannel Adapters؛ لا يوجد Meta logic داخل UI." : "Scheduling is driven by the content pipeline and channel adapters; Meta logic does not live in the UI."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Scheduler غير مفعّل بعد." : "Scheduler tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد منشورات مجدولة أو منشورة عبر Marketing Hub بعد." : "No scheduled or published Marketing Hub posts yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.5fr_.8fr_.8fr_1fr]"><div className="text-sm text-white">{item.title ?? `#${item.id}`}</div><div className="text-xs text-white/55">{item.channel ?? "—"}</div><div className="text-xs text-gold">{item.status}</div><div className="text-xs text-white/35">{item.scheduled_at ?? item.published_at ?? "—"}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
