import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getWhatsAppEmbeddedSignupPublicConfig } from "@/lib/marketing/channels/whatsapp";
import { createAdminClient } from "@/lib/supabase/admin";
import { WhatsAppEmbeddedSignup } from "./WhatsAppEmbeddedSignup";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ lang?: string }> };

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default async function WhatsAppIntegrationPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ data: integration }, publicConfig] = await Promise.all([
    db.from("marketing_integrations")
      .select("status,configuration_state,last_success_at,last_error")
      .eq("provider", "whatsapp")
      .maybeSingle(),
    getWhatsAppEmbeddedSignupPublicConfig().catch(() => ({ appId: "", configurationId: "", ready: false })),
  ]);

  const configuration = record(integration?.configuration_state);
  const phone = text(configuration.display_phone_number);
  const wabaId = text(configuration.waba_id);
  const phoneNumberId = text(configuration.phone_number_id);
  const connected = integration?.status === "connected" && Boolean(wabaId && phoneNumberId);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "ربط WhatsApp" : "WhatsApp Connection"}
        description={isArabic
          ? "ربط WhatsApp Business Platform الرسمي مع إبقاء الرقم داخل تطبيق WhatsApp Business عبر مسار Coexistence عندما يتيحه Meta."
          : "Connect the official WhatsApp Business Platform while keeping the number in the WhatsApp Business app through Meta Coexistence when available."}
      />

      <AdminCard className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base text-white">WhatsApp Business Platform</p>
            <p className="mt-1 text-xs text-white/35">Meta Cloud API · Embedded Signup · Coexistence</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-gold">
            {connected ? "connected" : integration?.status ?? "setup_required"}
          </span>
        </div>

        {connected ? (
          <div className="mt-5 grid gap-3 text-xs text-white/45 sm:grid-cols-2">
            <div>{isArabic ? "الرقم" : "Number"}<div className="mt-1 text-white/70">{phone ?? "connected"}</div></div>
            <div>WABA ID<div className="mt-1 break-all text-white/70">{wabaId}</div></div>
            <div>Phone Number ID<div className="mt-1 break-all text-white/70">{phoneNumberId}</div></div>
            <div>{isArabic ? "آخر نجاح" : "Last success"}<div className="mt-1 text-white/70">{integration?.last_success_at ? new Date(integration.last_success_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>
          </div>
        ) : publicConfig.ready ? (
          <div className="mt-5">
            <WhatsAppEmbeddedSignup
              appId={publicConfig.appId}
              configurationId={publicConfig.configurationId}
              isArabic={isArabic}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-xs leading-6 text-amber-100/80">
            {isArabic
              ? "الكود جاهز، لكن META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID غير متاح بعد في بيئة التشغيل. لا يتم طلب Access Token يدويًا ولا يجب فصل الرقم عن WhatsApp Business App."
              : "The code path is ready, but META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID is not available in the runtime yet. No manual access token is requested and the number must not be removed from the WhatsApp Business app."}
          </div>
        )}

        {integration?.last_error ? <p className="mt-4 text-xs text-red-300/80">{integration.last_error}</p> : null}
        <p className="mt-4 text-[11px] leading-5 text-amber-200/70">
          {isArabic
            ? "هذا المسار يربط الحساب فقط. لا يرسل أي رسالة، ولا يغيّر external_execution_enabled، ولا يتجاوز موافقة CEO."
            : "This flow only connects the account. It sends no message, does not change external_execution_enabled, and never bypasses CEO approval."}
        </p>
      </AdminCard>
    </AdminPageContainer>
  );
}
