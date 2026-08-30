import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingIntegrationsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_integrations").select("id,provider,status,capabilities,configuration_state,last_sync_at,last_success_at,last_error").order("provider");
  const integrations = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "مركز التكاملات" : "Integrations Center"} description={isArabic ? "حالة القنوات والقدرات المتاحة فعليًا. لا يتم عرض أو تخزين Access Tokens في الواجهة." : "Actual channel and capability state. Access tokens are never displayed or stored in the UI."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول التكاملات غير مفعلة بعد." : "Integration tables are not active yet."}</AdminCard> : null}
    <div className="grid gap-4 xl:grid-cols-2">{integrations.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد تكاملات مسجلة بعد." : "No integrations registered yet."}</AdminCard> : integrations.map((item) => <AdminCard key={item.id} className="p-5"><div className="flex items-center justify-between gap-4"><div><div className="text-base text-white capitalize">{item.provider}</div><div className="mt-1 text-xs text-white/35">{item.last_error ?? (isArabic ? "لا يوجد خطأ مسجل" : "No recorded error")}</div></div><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gold">{item.status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/45"><div>{isArabic ? "آخر مزامنة" : "Last sync"}<div className="mt-1 text-white/70">{item.last_sync_at ? new Date(item.last_sync_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div><div>{isArabic ? "آخر نجاح" : "Last success"}<div className="mt-1 text-white/70">{item.last_success_at ? new Date(item.last_success_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div></div></AdminCard>)}</div>
  </AdminPageContainer>;
}
