import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getMarketingAIConfigurationState } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };

type SettingValue = { enabled?: unknown } | null;

export default async function MarketingIntegrationsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const aiState = getMarketingAIConfigurationState();

  const [integrationsResult, gateResult] = await Promise.all([
    db
      .from("marketing_integrations")
      .select("id,provider,status,capabilities,configuration_state,last_sync_at,last_success_at,last_error")
      .order("provider"),
    db
      .from("marketing_settings")
      .select("value")
      .eq("key", "external_execution_enabled")
      .maybeSingle(),
  ]);

  const integrations = integrationsResult.data ?? [];
  const gateValue = (gateResult.data?.value ?? null) as SettingValue;
  const externalExecutionEnabled = gateValue?.enabled === true;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "مركز التكاملات" : "Integrations Center"}
        description={
          isArabic
            ? "حالة AI والقنوات والقدرات المتاحة فعليًا. لا يتم عرض أو تخزين Access Tokens في الواجهة."
            : "Actual AI, channel, and capability state. Access tokens are never displayed or stored in the UI."
        }
      />

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <AdminCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base text-white">Marketing AI</p>
              <p className="mt-1 text-xs text-white/35">OpenAI Responses API · {aiState.model}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${aiState.configured ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
              {aiState.configured ? "connected" : "setup_required"}
            </span>
          </div>
          <p className="mt-4 text-xs leading-6 text-white/45">
            {aiState.configured
              ? (isArabic ? "المفتاح موجود في بيئة الخادم ويمكن لمحرك المهام استخدام AI وفق الحوكمة." : "The server environment contains the AI credential and Task Engine can use it under governance.")
              : (isArabic ? "يلزم إضافة OPENAI_API_KEY إلى بيئة Vercel. المفتاح لا يُحفظ في Supabase." : "OPENAI_API_KEY must be added to the Vercel environment. The key is not stored in Supabase.")}
          </p>
        </AdminCard>

        <AdminCard className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base text-white">{isArabic ? "بوابة التنفيذ الخارجي" : "External execution gate"}</p>
              <p className="mt-1 text-xs text-white/35">Global kill switch</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${externalExecutionEnabled ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
              {externalExecutionEnabled ? "ENABLED" : "SAFE / DISABLED"}
            </span>
          </div>
          <p className="mt-4 text-xs leading-6 text-white/45">
            {isArabic
              ? "تظل الرسائل والمنشورات الخارجية محظورة حتى تكون القنوات متصلة ثم يتم فتح هذه البوابة عمدًا."
              : "External messages and publishing remain blocked until channels are connected and this gate is deliberately enabled."}
          </p>
        </AdminCard>
      </div>

      {integrationsResult.error ? (
        <AdminCard className="mb-5 p-5 text-sm text-amber-200">
          {isArabic ? "تعذر قراءة جداول التكاملات." : "Could not read integration tables."}
        </AdminCard>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {integrations.length === 0 ? (
          <AdminCard className="p-6 text-sm text-white/40">
            {isArabic ? "لا توجد تكاملات مسجلة بعد." : "No integrations registered yet."}
          </AdminCard>
        ) : integrations.map((item) => (
          <AdminCard key={item.id} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-base capitalize text-white">{item.provider}</div>
                <div className="mt-1 text-xs text-white/35">{item.last_error ?? (isArabic ? "لا يوجد خطأ مسجل" : "No recorded error")}</div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gold">{item.status}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/45">
              <div>{isArabic ? "آخر مزامنة" : "Last sync"}<div className="mt-1 text-white/70">{item.last_sync_at ? new Date(item.last_sync_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>
              <div>{isArabic ? "آخر نجاح" : "Last success"}<div className="mt-1 text-white/70">{item.last_success_at ? new Date(item.last_success_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminPageContainer>
  );
}
