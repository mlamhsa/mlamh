import {
  AdminCard,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getMarketingAIConfigurationState } from "@/lib/marketing/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { BufferConnectionTestForm } from "./BufferConnectionTestForm";
import { MetaConnectionTestForm } from "./MetaConnectionTestForm";
import {
  beginMetaFacebookOAuthAction,
  beginMetaInstagramOAuthAction,
  beginZohoMailOAuthAction,
} from "./actions";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string; zoho?: string; meta?: string }> };
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

function configurationRecord(state: ConfigurationState, key: string) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return null;
  const value = state[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function configurationArray(state: ConfigurationState, key: string) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return [];
  const value = state[key];
  return Array.isArray(value) ? value : [];
}

function hasCredentialRef(state: ConfigurationState, key: string) {
  const refs = configurationRecord(state, "credential_refs");
  const value = refs?.[key];
  return typeof value === "string" && value.startsWith("infisical://");
}

function hasLinkedInstagramAccount(state: ConfigurationState) {
  if (!configurationValue(state, "instagram_login_account_id")) return false;
  return configurationArray(state, "facebook_pages").some((page) => {
    if (!page || typeof page !== "object" || Array.isArray(page)) return false;
    const accountId = (page as Record<string, unknown>).instagramAccountId;
    return typeof accountId === "string" && accountId.trim().length > 0;
  });
}

function metaFacebookAccount(state: ConfigurationState) {
  const pages = configurationArray(state, "facebook_pages");
  const first = pages.find((page) => page && typeof page === "object" && !Array.isArray(page)) as Record<string, unknown> | undefined;
  if (!first) return null;
  const name = typeof first.name === "string" && first.name.trim() ? first.name.trim() : null;
  const id = typeof first.id === "string" && first.id.trim() ? first.id.trim() : null;
  return name ?? id;
}

function metaInstagramAccount(state: ConfigurationState) {
  const pages = configurationArray(state, "facebook_pages");
  for (const page of pages) {
    if (!page || typeof page !== "object" || Array.isArray(page)) continue;
    const record = page as Record<string, unknown>;
    const username = typeof record.instagramUsername === "string" && record.instagramUsername.trim() ? record.instagramUsername.trim() : null;
    if (username) return `@${username.replace(/^@/, "")}`;
  }
  return configurationValue(state, "instagram_login_account_id");
}

function formatDate(value: string | null | undefined, isArabic: boolean) {
  return value ? new Date(value).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—";
}

export default async function MarketingIntegrationsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, zoho, meta } = await searchParams;
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
        description={isArabic ? "حالة AI والقنوات والقدرات المتاحة فعليًا. لا يتم عرض أو تخزين Access Tokens في الواجهة." : "Actual AI, channel, and capability state. Access tokens are never displayed or stored in the UI."}
      />

      {zoho === "connected" ? <AdminCard className="mb-5 border-emerald-500/20 p-4 text-sm text-emerald-300">{isArabic ? "تم ربط hello@mlamh.net وحفظ اعتماد OAuth في مخزن الأسرار بنجاح. يبقى الإرسال الخارجي خاضعًا للموافقة وبوابة التنفيذ العامة." : "hello@mlamh.net is connected and its OAuth credential was stored in the secret store. External sends remain governed by approval and the global execution gate."}</AdminCard> : null}
      {zoho === "error" ? <AdminCard className="mb-5 border-red-500/20 p-4 text-sm text-red-300">{isArabic ? "تعذر ربط Zoho Mail. راجع إعدادات OAuth ومخزن الأسرار وData Center ثم أعد المحاولة." : "Zoho Mail connection failed. Check OAuth, secret-store, and data-center configuration, then retry."}</AdminCard> : null}
      {meta === "instagram_connected" ? <AdminCard className="mb-5 border-emerald-500/20 p-4 text-sm text-emerald-300">{isArabic ? "تم ربط Instagram عبر OAuth بنجاح. الاعتماد محفوظ server-side في Infisical فقط." : "Instagram OAuth connected successfully. Credentials remain server-side in Infisical only."}</AdminCard> : null}
      {meta === "facebook_connected" ? <AdminCard className="mb-5 border-emerald-500/20 p-4 text-sm text-emerald-300">{isArabic ? "تم ربط Facebook عبر OAuth بنجاح. الاعتماد محفوظ server-side في Infisical فقط." : "Facebook OAuth connected successfully. Credentials remain server-side in Infisical only."}</AdminCard> : null}
      {meta === "error" ? <AdminCard className="mb-5 border-red-500/20 p-4 text-sm text-red-300">{isArabic ? "تعذر إكمال ربط Meta. لم يتم عرض أي اعتماد أو Access Token؛ راجع الخطأ الآمن داخل بطاقة Meta." : "Meta OAuth connection failed. No credential or access token was exposed; review the safe error in the Meta card."}</AdminCard> : null}

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
          <p className="mt-4 text-xs leading-6 text-white/45">{isArabic ? "تظل الرسائل والمنشورات الخارجية محظورة حتى تكون القنوات متصلة ثم يتم فتح هذه البوابة عمدًا." : "External messages and publishing remain blocked until channels are connected and this gate is deliberately enabled."}</p>
        </AdminCard>
      </div>

      {integrationsResult.error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر قراءة جداول التكاملات." : "Could not read integration tables."}</AdminCard> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {integrations.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد تكاملات مسجلة بعد." : "No integrations registered yet."}</AdminCard> : integrations.map((item) => {
          const configuration = item.configuration_state as ConfigurationState;
          const instagramChannelId = item.provider === "buffer" ? configurationValue(configuration, "instagram_channel_id") : null;
          const facebookChannelId = item.provider === "buffer" ? configurationValue(configuration, "facebook_channel_id") : null;
          const zohoAddress = item.provider === "email" ? configurationValue(configuration, "verified_address") : null;
          const zohoAccountId = item.provider === "email" ? configurationValue(configuration, "account_id") : null;
          const zohoApiBase = item.provider === "email" ? configurationValue(configuration, "api_base_url") : null;
          const zohoAccountsBase = item.provider === "email" ? configurationValue(configuration, "accounts_base_url") : null;
          const zohoCredentialStore = item.provider === "email" ? configurationValue(configuration, "credential_store") : null;
          const metaFacebookConnected = item.provider === "meta" && hasCredentialRef(configuration, "facebook_user") && hasCredentialRef(configuration, "facebook_pages");
          const metaInstagramConnected = item.provider === "meta" && hasCredentialRef(configuration, "facebook_pages") && hasLinkedInstagramAccount(configuration);
          const metaFacebookName = item.provider === "meta" ? metaFacebookAccount(configuration) : null;
          const metaInstagramName = item.provider === "meta" ? metaInstagramAccount(configuration) : null;
          const metaConnected = item.provider === "meta" && item.status === "connected" && metaFacebookConnected && metaInstagramConnected;

          return (
            <AdminCard key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base capitalize text-white">{item.provider}</div>
                  <div className="mt-1 text-xs text-white/35">{item.last_error ?? (isArabic ? "لا يوجد خطأ مسجل" : "No recorded error")}</div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gold">{item.status}</span>
              </div>

              {item.provider === "meta" ? (
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div>
                    <p className="text-xs font-medium text-white/70">Meta · OAuth + Infisical</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/35">{isArabic ? "الربط يتم عبر OAuth فقط. لا يوجد إدخال أو عرض أو نسخ Access Token يدويًا، وتبقى الاعتمادات في Infisical /meta." : "Connections use OAuth only. Access tokens are never entered, displayed, or copied manually; credentials remain in Infisical /meta."}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/[0.07] p-3">
                      <div className="flex items-center justify-between gap-2"><span className="text-xs text-white/70">Instagram</span><span className={`text-[11px] ${metaInstagramConnected ? "text-emerald-300" : "text-white/35"}`}>{metaInstagramConnected ? "connected" : "not connected"}</span></div>
                      <div className="mt-2 text-[11px] text-white/45">{isArabic ? "الحساب" : "Account"}: <span className="text-white/70">{metaInstagramName ?? "—"}</span></div>
                      <form action={beginMetaInstagramOAuthAction} className="mt-3"><button className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{metaInstagramConnected ? (isArabic ? "إعادة ربط Instagram" : "Reconnect Instagram") : (isArabic ? "ربط Instagram" : "Connect Instagram")}</button></form>
                    </div>
                    <div className="rounded-lg border border-white/[0.07] p-3">
                      <div className="flex items-center justify-between gap-2"><span className="text-xs text-white/70">Facebook</span><span className={`text-[11px] ${metaFacebookConnected ? "text-emerald-300" : "text-white/35"}`}>{metaFacebookConnected ? "connected" : "not connected"}</span></div>
                      <div className="mt-2 text-[11px] text-white/45">{isArabic ? "الحساب/الصفحة" : "Account/Page"}: <span className="text-white/70">{metaFacebookName ?? "—"}</span></div>
                      <form action={beginMetaFacebookOAuthAction} className="mt-3"><button className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{metaFacebookConnected ? (isArabic ? "إعادة ربط Facebook" : "Reconnect Facebook") : (isArabic ? "ربط Facebook" : "Connect Facebook")}</button></form>
                    </div>
                  </div>
                  {metaConnected ? <MetaConnectionTestForm isArabic={isArabic} /> : null}
                  <div className="mt-4 grid gap-2 text-[11px] text-white/40 sm:grid-cols-2">
                    <div>{isArabic ? "آخر مزامنة" : "Last sync"}<div className="mt-1 text-white/65">{formatDate(item.last_sync_at, isArabic)}</div></div>
                    <div>{isArabic ? "آخر نجاح" : "Last success"}<div className="mt-1 text-white/65">{formatDate(item.last_success_at, isArabic)}</div></div>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-amber-200/70">{isArabic ? "نجاح OAuth لا ينشر ولا يرسل أي محتوى. Meta outbound يبقى معطلاً وخاضعًا للحوكمة وبوابة التنفيذ العامة." : "OAuth success does not publish or send content. Meta outbound remains disabled and governed by the global execution gate."}</p>
                </div>
              ) : null}

              {item.provider === "buffer" ? (
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">Buffer · READ ONLY connection test</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">{isArabic ? "يجلب الحساب والقنوات فقط. لا يوجد في هذا المسار أي نشر أو جدولة Posts." : "Fetches account and channels only. This path contains no post publish or scheduling operation."}</p>
                    </div>
                    <BufferConnectionTestForm isArabic={isArabic} />
                  </div>

                  {(instagramChannelId || facebookChannelId) ? (
                    <div className="mt-4 grid gap-2 text-[11px] text-white/40 sm:grid-cols-2">
                      <div>Instagram @mlamhco<div className="mt-1 break-all text-white/65">{instagramChannelId ?? "—"}</div></div>
                      <div>Facebook MLAMH<div className="mt-1 break-all text-white/65">{facebookChannelId ?? "—"}</div></div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {item.provider === "email" ? (
                <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">Zoho Mail · OAuth + Secret Store</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/35">{isArabic ? "OAuth يتحقق من hello@mlamh.net، وRefresh Token يبقى server-side داخل مخزن الأسرار. لا SMTP ولا Password." : "OAuth verifies hello@mlamh.net and the refresh token remains server-side in the secret store. No SMTP or password."}</p>
                      <p className="mt-1 text-[11px] text-white/25">Scopes: ZohoMail.accounts.READ · ZohoMail.messages.CREATE</p>
                    </div>
                    <form action={beginZohoMailOAuthAction}>
                      <button className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{item.status === "connected" ? (isArabic ? "إعادة ربط Zoho" : "Reconnect Zoho") : (isArabic ? "ربط Zoho" : "Connect Zoho")}</button>
                    </form>
                  </div>
                  <div className="mt-4 grid gap-2 text-[11px] text-white/40 sm:grid-cols-2">
                    <div>{isArabic ? "الحساب الموثق" : "Verified account"}<div className="mt-1 break-all text-white/65">{zohoAddress ?? "—"}</div></div>
                    <div>Zoho accountId<div className="mt-1 break-all text-white/65">{zohoAccountId ?? "—"}</div></div>
                    <div>Accounts base<div className="mt-1 break-all text-white/65">{zohoAccountsBase ?? "env / not connected"}</div></div>
                    <div>Mail API base<div className="mt-1 break-all text-white/65">{zohoApiBase ?? "env / not connected"}</div></div>
                    <div>{isArabic ? "مخزن الاعتماد" : "Credential store"}<div className="mt-1 break-all text-white/65">{zohoCredentialStore ?? "—"}</div></div>
                    <div>{isArabic ? "الإرسال" : "Sending"}<div className="mt-1 text-white/65">{item.status === "connected" ? (externalExecutionEnabled ? "governed / enabled" : "connected / kill switch off") : "blocked"}</div></div>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-amber-200/70">{isArabic ? "نجاح الاتصال لا يرسل أي بريد تلقائيًا. أول Outreach ما زال يحتاج Approval، وSend now مستقل، والبوابة العامة تمنع التنفيذ عندما تكون معطلة." : "Connecting never sends email automatically. First outreach still requires approval, Send now is separate, and the global gate blocks execution while disabled."}</p>
                </div>
              ) : null}

              {item.provider !== "meta" ? (
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/45">
                  <div>{isArabic ? "آخر مزامنة" : "Last sync"}<div className="mt-1 text-white/70">{formatDate(item.last_sync_at, isArabic)}</div></div>
                  <div>{isArabic ? "آخر نجاح" : "Last success"}<div className="mt-1 text-white/70">{formatDate(item.last_success_at, isArabic)}</div></div>
                </div>
              ) : null}
            </AdminCard>
          );
        })}
      </div>
    </AdminPageContainer>
  );
}
