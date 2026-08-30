import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingBriefsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_briefs").select("id,project_type,talent_type,talent_count,city,shoot_date,compensation,budget,lead_id,conversation_id,opportunity_id,status,created_at").order("created_at", { ascending: false }).limit(150);
  const briefs = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "Brief Engine" : "Brief Engine"} description={isArabic ? "تحويل محادثة B2B الجادة إلى احتياج منظم يمكن لاحقًا تحويله إلى Opportunity." : "Turn serious B2B conversations into structured briefs that can later become opportunities."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Brief Engine غير مفعلة بعد." : "Brief Engine tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{briefs.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد Briefs حقيقية حتى الآن." : "No real briefs yet."}</div> : briefs.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_.7fr_.7fr_.8fr_.7fr]"><div><div className="text-sm text-white">{item.project_type ?? "—"}</div><div className="mt-1 text-xs text-white/35">#{item.id} · Lead {item.lead_id ?? "—"}</div></div><div className="text-xs text-white/55">{item.talent_type ?? "—"} · {item.talent_count ?? "—"}</div><div className="text-xs text-white/55">{item.city ?? "—"}</div><div className="text-xs text-white/55">{item.shoot_date ?? "—"}<div className="mt-1 text-white/35">{item.budget ?? "—"}</div></div><div className="text-xs text-gold">{item.status}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
