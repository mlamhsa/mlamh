import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getMarketingAIConfigurationState } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { testBufferConnectionAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };
type SettingValue = { enabled?: unknown } | null;
type ConfigurationState = Record<string, unknown> | null;

function aiAuthLabel(authMode: string) {
  if (authMode === "vercel_oidc") return "Vercel OIDC";
  if (authMode === "gateway_api_key") return "AI Gateway API Key";
  if (authMode === "openai_api_key") return "OpenAI API Key";
  return "Not configured";
}

function configurationValue(state: ConfigurationState, key: string) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return null;
  const value = state[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

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
              <p className="mt-1 text-xs text-white/35">{aiState.provider} · {aiState.model}</p>
              <p className="mt-1 text-[11px] text-white/25">{aiAuthLabel(aiState.authMode)}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs ${aiState.configured ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}>
              {aiState.configured ? "connected" : "setup_required"}
            </span>
          </div>
          <p className="mt-4 text-xs leading-6 text-white/45">
            {aiState.configured
              ? (isArabic ? "محرك المهام يستطيع استخدام AI الآن وفق الحوكمة. المصادقة تتم من بيئة الخادم ولا تُعرض أي أسرار هنا." : "Task Engine can use AI under governance. Authentication stays server-side and no secrets are exposed here.")
              : (isArabic ? "سيستخدم النظام Vercel AI Gateway عبر OIDC تلقائيًا عند توفره، أو AI_GATEWAY_API_KEY / OPENAI_API_KEY كخيار احتياطي." : "The system will use Vercel AI Gateway via OIDC when available, with AI_GATEWAY_API_KEY / OPENAI_API_KEY as fallbacks.")}
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
        ) : integrations.map((item) => {
          const configuration = item.configuration_state as ConfigurationState;
          const instagramChannelId = item.provider === "buffer" ? configurationValue(configuration, "instagram_channel_id") : null;
          const facebookChannelId = item.provider === "buffer" ? configurationValue(configuration, "facebook_channel_id") : null;

          return (
            <AdminCard key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base capitalize text-white">{item.provider}</div>
                  <div className="mt-1 text-xs text-white/35">{item.last_error ?? (isArabic ? "لا يوجد خطأ مسجل" : "No recorded error")}</div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gold">{item.status}</span>
              </div>

              {item.provider === "buffer" ? (
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">Buffer · READ ONLY connection test</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">
                        {isArabic
                          ? "يجلب الحساب والقنوات فقط. لا يوجد في هذا المسار أي نشر أو جدولة Posts."
                          : "Fetches account and channels only. This path contains no post publish or scheduling operation."}
                      </p>
                    </div>
                    <form action={testBufferConnectionAction}>
                      <button type="submit" className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold transition hover:bg-gold hover:text-black">
                        {isArabic ? "اختبار اتصال Buffer" : "Test Buffer connection"}
                      </button>
                    </form>
                  </div>

                  {(instagramChannelId || facebookChannelId) ? (
                    <div className="mt-4 grid gap-2 text-[11px] text-white/40 sm:grid-cols-2">
                      <div>Instagram @mlamhco<div className="mt-1 break-all text-white/65">{instagramChannelId ?? "—"}</div></div>
                      <div>Facebook MLAMH<div className="mt-1 break-all text-white/65">{facebookChannelId ?? "—"}</div></div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/45">
                <div>{isArabic ? "آخر مزامنة" : "Last sync"}<div className="mt-1 text-white/70">{item.last_sync_at ? new Date(item.last_sync_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>
                <div>{isArabic ? "آخر نجاح" : "Last success"}<div className="mt-1 text-white/70">{item.last_success_at ? new Date(item.last_success_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>
              </div>
            </AdminCard>
          );
        })}
      </div>
    </AdminPageContainer>
  );
}
