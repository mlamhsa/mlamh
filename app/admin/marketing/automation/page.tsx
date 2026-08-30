import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function AutomationPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_automation_rules").select("id,name,event_name,conditions,actions,delay_seconds,status,created_at").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "قواعد الأتمتة" : "Automation Rules"} description={isArabic ? "Event-driven rules: WHEN + IF + THEN مع تأخير اختياري، بدون Giant Cron." : "Event-driven rules: WHEN + IF + THEN with optional delay, without a giant cron."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "قواعد الأتمتة غير مفعلة بعد." : "Automation rule storage is not active yet."}</AdminCard> : null}
    <div className="grid gap-4">{rows.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد قواعد نشطة حاليًا." : "No active rules yet."}</AdminCard> : rows.map((item) => <AdminCard key={item.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-base text-white">{item.name}</div><div className="mt-1 text-xs text-white/40">WHEN {item.event_name} · WAIT {item.delay_seconds}s</div></div><span className="text-xs text-gold">{item.status}</span></div><div className="mt-4 grid gap-3 text-xs text-white/45 md:grid-cols-2"><div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">IF<br/><span className="text-white/65">{JSON.stringify(item.conditions)}</span></div><div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">THEN<br/><span className="text-white/65">{JSON.stringify(item.actions)}</span></div></div></AdminCard>)}</div>
  </AdminPageContainer>;
}
