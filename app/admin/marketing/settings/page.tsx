import { AdminBadge, AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function integrationVariant(status: string) {
  if (status === "connected") return "success" as const;
  if (status === "error") return "danger" as const;
  if (status === "limited") return "warning" as const;
  return "muted" as const;
}

export default async function MarketingSettingsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [agents, integrations, executionSetting] = await Promise.all([
    db.from("marketing_agents").select("id,name,role,autonomy_level,status,is_active").order("id"),
    db.from("marketing_integrations").select("provider,status,capabilities").order("provider"),
    db.from("marketing_settings").select("value").eq("key", "external_execution_enabled").maybeSingle(),
  ]);
  const externalEnabled = record(executionSetting.data?.value).enabled === true;
  const activeAgents = (agents.data ?? []).filter((agent) => agent.is_active);
  const connected = (integrations.data ?? []).filter((item) => item.status === "connected").length;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow="MLAMH GOVERNANCE"
      title={isArabic ? "إعدادات Marketing Hub" : "Marketing Hub Settings"}
      description={isArabic ? "مركز الحوكمة التشغيلي: استقلالية الفريق، جاهزية القنوات، وحالة بوابة التنفيذ الخارجي. الأسرار ومفاتيح API تبقى خارج الواجهة وقاعدة البيانات العادية." : "Operational governance: team autonomy, channel readiness and the external-execution gate. Secrets and API keys remain outside the UI and normal database tables."}
    />

    <AdminCard className={`mb-6 overflow-hidden ${externalEnabled ? "border-emerald-500/25 bg-emerald-500/[0.035]" : "border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.018] to-transparent"}`}>
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminBadge variant={externalEnabled ? "success" : "warning"}>{externalEnabled ? "EXTERNAL EXECUTION ON" : "EXTERNAL EXECUTION LOCKED"}</AdminBadge>
            <AdminBadge variant="muted">{activeAgents.length} AI AGENTS</AdminBadge>
            <AdminBadge variant="muted">{connected} CONNECTED</AdminBadge>
          </div>
          <h2 className="mt-3 text-xl font-medium text-white">{externalEnabled ? (isArabic ? "بوابة التنفيذ الخارجي مفعلة" : "External execution is enabled") : (isArabic ? "العمل الداخلي مستمر — الإرسال والنشر الخارجي مقفل" : "Internal work continues — external send and publish are locked")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">{isArabic ? "تحليل البيانات، إنشاء المهام، كتابة المحتوى، وتجهيز مسودات التواصل يمكن أن تعمل دون هذا المفتاح. القنوات الخارجية لا تُنفذ إلا بعد استيفاء الحوكمة وبوابة التنفيذ." : "Analysis, task creation, content drafting and outreach preparation can run without this gate. External channels execute only after governance is satisfied and the execution gate is enabled."}</p>
        </div>
        <div className={`flex min-w-44 items-center justify-between rounded-2xl border px-4 py-3 ${externalEnabled ? "border-emerald-500/25 bg-emerald-500/[0.06]" : "border-white/[0.08] bg-black/20"}`}>
          <span className="text-xs text-white/45">{isArabic ? "حالة البوابة" : "Execution gate"}</span>
          <span className={`relative h-6 w-11 rounded-full transition ${externalEnabled ? "bg-emerald-400/80" : "bg-white/[0.1]"}`} aria-label={externalEnabled ? "enabled" : "disabled"}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${externalEnabled ? "right-1" : "left-1"}`} />
          </span>
        </div>
      </div>
    </AdminCard>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">AI OPERATING MODEL</p><h2 className="mt-1 text-lg text-white">{isArabic ? "استقلالية الفريق" : "Team autonomy"}</h2></div>
        <div className="divide-y divide-white/[0.06]">{activeAgents.map((agent) => <div key={agent.id} className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.018]"><div className="min-w-0"><p className="text-sm font-medium text-white/80">{agent.name}</p><p className="mt-1 truncate text-xs text-white/35">{agent.role}</p></div><div className="flex shrink-0 items-center gap-2"><AdminBadge variant={agent.status === "working" ? "gold" : agent.status === "error" ? "danger" : "muted"} className="px-2 py-0.5 tracking-[0.1em]">{agent.status}</AdminBadge><AdminBadge variant={agent.autonomy_level === "auto" ? "success" : agent.autonomy_level === "ceo_only" ? "warning" : "gold"} className="px-2 py-0.5 tracking-[0.1em]">{agent.autonomy_level}</AdminBadge></div></div>)}</div>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">CHANNEL GOVERNANCE</p><h2 className="mt-1 text-lg text-white">{isArabic ? "جاهزية القنوات" : "Channel readiness"}</h2></div>
        <div className="divide-y divide-white/[0.06]">{(integrations.data ?? []).map((item) => {
          const capabilities = record(item.capabilities);
          const enabledCapabilities = Object.entries(capabilities).filter(([, value]) => value === true).map(([key]) => key);
          return <div key={item.provider} className="group px-5 py-4 transition-colors hover:bg-white/[0.018]"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium capitalize text-white/75">{item.provider}</span><AdminBadge variant={integrationVariant(item.status)} className="px-2 py-0.5 tracking-[0.1em]">{item.status}</AdminBadge></div><p className="mt-2 line-clamp-1 text-[10px] text-white/25">{enabledCapabilities.length ? enabledCapabilities.join(" · ") : (isArabic ? "لا توجد صلاحيات تنفيذ مفعلة" : "No active execution capabilities")}</p></div>;
        })}</div>
      </AdminCard>
    </div>
  </AdminPageContainer>;
}
