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

function providerName(provider: string) {
  if (provider === "email") return "Zoho Mail";
  if (provider === "meta") return "Meta";
  if (provider === "buffer") return "Buffer";
  if (provider === "whatsapp") return "WhatsApp";
  return provider;
}

export default async function MarketingIntegrationsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, zoho, meta } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const aiState = getMarketingAIConfigurationState();

  const [integrationsResult, gateResult] = await Promise.all([
    db.from("marketing_integrations").select("id,provider,status,capabilities,configuration_state,last_sync_at,last_success_at,last_error").order("provider"),
    db.from("marketing_settings").select("value").eq("key", "external_execution_enabled").maybeSingle(),
  ]);

  const integrations = integrationsResult.data ?? [];
  const gateValue = (gateResult.data?.value ?? null) as SettingValue;
  const externalExecutionEnabled = gateValue?.enabled === true;
  const connectedCount = integrations.filter((item) => item.status === "connected").length + (aiState.configured ? 1 : 0);
  const attentionCount = integrations.filter((item) => item.status !== "connected" || Boolean(item.last_error)).length + (aiState.configured ? 0 : 1);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow={isArabic ? "MLAMH · قنوات التشغيل" : "MLAMH · OPERATING CHANNELS"}
        title={isArabic ? "مركز التكاملات" : "Integrations Center"}
        description={isArabic ? "اعرف فورًا ما هو متصل، ما يحتاج تدخلًا، وما يمكن للفريق استخدامه الآن — بدون ازدحام بالتفاصيل التقنية." : "See what is connected, what needs attention, and what the team can use now without technical clutter."}
      />

      {zoho === "connected" || meta === "instagram_connected" || meta === "facebook_connected" ? (
        <AdminCard className="mb-5 border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-sm text-emerald-200">
          {isArabic ? "تم تحديث الاتصال بنجاح. لم يتم إرسال أو نشر أي محتوى." : "Connection updated successfully. No content was sent or published."}
        </AdminCard>
      ) : null}
      {zoho === "error" || meta === "error" ? (
        <AdminCard className="mb-5 border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-red-200">
          {isArabic ? "تعذر إكمال أحد الاتصالات. افتح القناة المتأثرة أدناه لمراجعة الحالة وإعادة الربط." : "A connection could not be completed. Review the affected channel below and reconnect."}
        </AdminCard>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <AdminCard className="p-5">
          <p className="text-xs text-white/40">{isArabic ? "جاهز ومتصّل" : "Connected & ready"}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{connectedCount}</p>
          <p className="mt-2 text-xs text-white/35">{isArabic ? "AI والقنوات المتصلة حاليًا" : "AI and channels currently connected"}</p>
        </AdminCard>
        <AdminCard className="p-5">
          <p className="text-xs text-white/40">{isArabic ? "يحتاج انتباه" : "Needs attention"}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{attentionCount}</p>
          <p className="mt-2 text-xs text-white/35">{isArabic ? "إعداد أو إعادة ربط أو خطأ مسجل" : "Setup, reconnect, or recorded error"}</p>
        </AdminCard>
        <AdminCard className={`p-5 ${externalExecutionEnabled ? "border-red-500/20" : "border-emerald-500/20"}`}>
          <p className="text-xs text-white/40">{isArabic ? "التنفيذ الخارجي" : "External execution"}</p>
          <p className={`mt-2 text-lg font-semibold ${externalExecutionEnabled ? "text-red-200" : "text-emerald-300"}`}>
            {externalExecutionEnabled ? (isArabic ? "مفعّل" : "Enabled") : (isArabic ? "محمي · متوقف" : "Safe · Off")}
          </p>
          <p className="mt-2 text-xs text-white/35">{isArabic ? "حالة بوابة الإرسال والنشر العامة" : "Global send and publish gate"}</p>
        </AdminCard>
      </div>

      <AdminCard className="mb-6 overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.06] via-white/[0.02] to-transparent p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold/70">{isArabic ? "حالة غرفة التشغيل" : "OPERATING STATUS"}</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{isArabic ? "القنوات يمكن تجهيزها بأمان قبل فتح التنفيذ" : "Channels can be prepared safely before execution is opened"}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">{isArabic ? "الاتصال والاختبار لا يعني النشر. يبقى أي إرسال خارجي خاضعًا للموافقات والحوكمة، وبوابة التنفيذ الحالية لا تتغير من هذه الشاشة." : "Connecting and testing do not publish anything. External actions remain governed by approvals, and this screen does not change the execution gate."}</p>
          </div>
          <span className="w-fit rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">{isArabic ? "وضع آمن" : "Safe mode"}</span>
        </div>
      </AdminCard>

      {integrationsResult.error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر قراءة حالة التكاملات." : "Could not read integration status."}</AdminCard> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-base font-medium text-white">Marketing AI</p><p className="mt-1 text-xs text-white/35">{isArabic ? "محرك إنشاء وتحليل المحتوى" : "Content creation and analysis engine"}</p></div>
            <span className={`rounded-full border px-3 py-1 text-xs ${aiState.configured ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-200"}`}>{aiState.configured ? (isArabic ? "متصل" : "Connected") : (isArabic ? "يحتاج إعداد" : "Needs setup")}</span>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/55">{aiState.configured ? (isArabic ? "جاهز لمساندة فريق التسويق ضمن الحوكمة الحالية." : "Ready to support the marketing team under current governance.") : (isArabic ? "يحتاج إكمال إعداد مزود AI قبل استخدامه في المهام." : "AI provider setup must be completed before task use.")}</p>
          <details className="mt-5 border-t border-white/[0.07] pt-4 text-xs text-white/40"><summary className="cursor-pointer text-white/55">{isArabic ? "عرض التفاصيل التقنية" : "Technical details"}</summary><div className="mt-3 space-y-1"><p>{aiState.provider} · {aiState.model}</p><p>{aiState.authMode}</p></div></details>
        </AdminCard>

        {integrations.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد قنوات مسجلة بعد." : "No channels registered yet."}</AdminCard> : integrations.map((item) => {
          const configuration = item.configuration_state as ConfigurationState;
          const instagramChannelId = item.provider === "buffer" ? configurationValue(configuration, "instagram_channel_id") : null;
          const facebookChannelId = item.provider === "buffer" ? configurationValue(configuration, "facebook_channel_id") : null;
          const zohoAddress = item.provider === "email" ? configurationValue(configuration, "verified_address") : null;
          const metaFacebookConnected = item.provider === "meta" && hasCredentialRef(configuration, "facebook_user") && hasCredentialRef(configuration, "facebook_pages");
          const metaInstagramConnected = item.provider === "meta" && hasCredentialRef(configuration, "facebook_pages") && hasLinkedInstagramAccount(configuration);
          const metaFacebookName = item.provider === "meta" ? metaFacebookAccount(configuration) : null;
          const metaInstagramName = item.provider === "meta" ? metaInstagramAccount(configuration) : null;
          const metaConnected = item.provider === "meta" && item.status === "connected" && metaFacebookConnected && metaInstagramConnected;
          const whatsappPhone = item.provider === "whatsapp" ? configurationValue(configuration, "display_phone_number") : null;
          const connected = item.status === "connected";

          return <AdminCard key={item.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-base font-medium text-white">{providerName(item.provider)}</p><p className="mt-1 text-xs text-white/35">{item.provider === "meta" ? "Instagram + Facebook" : item.provider === "buffer" ? (isArabic ? "جدولة ونشر اجتماعي" : "Social scheduling") : item.provider === "email" ? "hello@mlamh.net" : item.provider === "whatsapp" ? (isArabic ? "مراسلات الأعمال" : "Business messaging") : (isArabic ? "قناة تسويقية" : "Marketing channel")}</p></div>
              <span className={`rounded-full border px-3 py-1 text-xs ${connected ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-200"}`}>{connected ? (isArabic ? "متصل" : "Connected") : (isArabic ? "يحتاج إعداد" : "Needs setup")}</span>
            </div>

            {item.last_error ? <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3 text-xs leading-5 text-amber-100/75">{isArabic ? "آخر ملاحظة: " : "Last note: "}{item.last_error}</div> : null}

            {item.provider === "meta" ? <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-white">Instagram</span><span className={metaInstagramConnected ? "text-xs text-emerald-300" : "text-xs text-white/35"}>{metaInstagramConnected ? (isArabic ? "جاهز" : "Ready") : (isArabic ? "غير متصل" : "Not connected")}</span></div><p className="mt-2 text-xs text-white/45">{metaInstagramName ?? "—"}</p><form action={beginMetaInstagramOAuthAction} className="mt-4"><button className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{metaInstagramConnected ? (isArabic ? "إعادة الربط" : "Reconnect") : (isArabic ? "ربط الحساب" : "Connect")}</button></form></div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm text-white">Facebook</span><span className={metaFacebookConnected ? "text-xs text-emerald-300" : "text-xs text-white/35"}>{metaFacebookConnected ? (isArabic ? "جاهز" : "Ready") : (isArabic ? "غير متصل" : "Not connected")}</span></div><p className="mt-2 text-xs text-white/45">{metaFacebookName ?? "—"}</p><form action={beginMetaFacebookOAuthAction} className="mt-4"><button className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{metaFacebookConnected ? (isArabic ? "إعادة الربط" : "Reconnect") : (isArabic ? "ربط الصفحة" : "Connect")}</button></form></div>
              {metaConnected ? <div className="sm:col-span-2"><MetaConnectionTestForm isArabic={isArabic} /></div> : null}
            </div> : null}

            {item.provider === "buffer" ? <div className="mt-5"><p className="text-sm text-white/60">{isArabic ? "تحقق من الاتصال والقنوات بدون نشر أي محتوى." : "Verify the account and channels without publishing content."}</p><div className="mt-4"><BufferConnectionTestForm isArabic={isArabic} /></div></div> : null}

            {item.provider === "email" ? <div className="mt-5"><p className="text-sm text-white/60">{zohoAddress ? (isArabic ? `الحساب المتصل: ${zohoAddress}` : `Connected account: ${zohoAddress}`) : (isArabic ? "اربط بريد ملامح الرسمي لتمكين مسار التواصل." : "Connect MLAMH email to enable outreach workflows.")}</p><form action={beginZohoMailOAuthAction} className="mt-4"><button className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{connected ? (isArabic ? "إعادة ربط Zoho" : "Reconnect Zoho") : (isArabic ? "ربط Zoho" : "Connect Zoho")}</button></form></div> : null}

            {item.provider === "whatsapp" ? <div className="mt-5"><p className="text-sm text-white/60">{whatsappPhone ? (isArabic ? `الرقم المتصل: ${whatsappPhone}` : `Connected number: ${whatsappPhone}`) : (isArabic ? "أكمل الربط الرسمي عبر Meta عندما تصبح القناة مطلوبة للتشغيل." : "Complete the official Meta connection when this channel is needed.")}</p><a href={`/admin/marketing/integrations/whatsapp${lang ? `?lang=${encodeURIComponent(lang)}` : ""}`} className="mt-4 inline-block rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold">{connected ? (isArabic ? "إدارة WhatsApp" : "Manage WhatsApp") : (isArabic ? "ربط WhatsApp" : "Connect WhatsApp")}</a></div> : null}

            <details className="mt-5 border-t border-white/[0.07] pt-4 text-xs text-white/40">
              <summary className="cursor-pointer text-white/55">{isArabic ? "عرض التفاصيل التقنية" : "Technical details"}</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2"><div>{isArabic ? "آخر مزامنة" : "Last sync"}: <span className="text-white/65">{formatDate(item.last_sync_at, isArabic)}</span></div><div>{isArabic ? "آخر نجاح" : "Last success"}: <span className="text-white/65">{formatDate(item.last_success_at, isArabic)}</span></div>{item.provider === "buffer" ? <><div className="break-all">Instagram ID: {instagramChannelId ?? "—"}</div><div className="break-all">Facebook ID: {facebookChannelId ?? "—"}</div></> : null}</div>
            </details>
          </AdminCard>;
        })}
      </div>
    </AdminPageContainer>
  );
}
