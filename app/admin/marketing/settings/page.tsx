import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingSettingsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [agents, integrations] = await Promise.all([
    db.from("marketing_agents").select("id,name,role,autonomy_level,is_active").order("id"),
    db.from("marketing_integrations").select("provider,status").order("provider"),
  ]);
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "إعدادات Marketing Hub" : "Marketing Hub Settings"} description={isArabic ? "إعدادات التشغيل والحوكمة فقط. الأسرار ومفاتيح API تبقى Server-side خارج قاعدة البيانات العادية." : "Operational and governance settings only. Secrets and API keys remain server-side outside normal database tables."} />
    <div className="grid gap-5 xl:grid-cols-2"><AdminCard className="p-5"><h2 className="text-lg text-white">{isArabic ? "استقلالية الفريق" : "Team autonomy"}</h2><div className="mt-4 space-y-2">{(agents.data ?? []).map((agent) => <div key={agent.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"><span className="text-white/65">{agent.name}</span><span className="text-gold">{agent.autonomy_level}</span></div>)}</div></AdminCard><AdminCard className="p-5"><h2 className="text-lg text-white">{isArabic ? "حالة القنوات" : "Channel state"}</h2><div className="mt-4 space-y-2">{(integrations.data ?? []).map((item) => <div key={item.provider} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"><span className="text-white/65 capitalize">{item.provider}</span><span className="text-gold">{item.status}</span></div>)}</div></AdminCard></div>
  </AdminPageContainer>;
}
