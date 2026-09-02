"use client";

import { useEffect, useRef, useState } from "react";

type SignupSession = {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string | null;
};

type FbLoginResponse = {
  authResponse?: { code?: string };
};

type FbApi = {
  init(options: Record<string, unknown>): void;
  login(callback: (response: FbLoginResponse) => void, options: Record<string, unknown>): void;
};

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: FbApi;
  }
}

function readSessionEvent(data: unknown): SignupSession | null {
  let value = data;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const envelope = value as Record<string, unknown>;
  if (envelope.type !== "WA_EMBEDDED_SIGNUP") return null;
  if (envelope.event !== "FINISH" && envelope.event !== "FINISH_ONLY_WABA") return null;
  const payload = envelope.data && typeof envelope.data === "object" && !Array.isArray(envelope.data)
    ? envelope.data as Record<string, unknown>
    : {};
  const wabaId = typeof payload.waba_id === "string" ? payload.waba_id.trim() : "";
  const phoneNumberId = typeof payload.phone_number_id === "string" ? payload.phone_number_id.trim() : "";
  const displayPhoneNumber = typeof payload.display_phone_number === "string" ? payload.display_phone_number.trim() : null;
  return wabaId && phoneNumberId ? { wabaId, phoneNumberId, displayPhoneNumber } : null;
}

export function WhatsAppEmbeddedSignup({ appId, configurationId, isArabic }: { appId: string; configurationId: string; isArabic: boolean }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const codeRef = useRef<string | null>(null);
  const sessionRef = useRef<SignupSession | null>(null);
  const completingRef = useRef(false);

  async function tryComplete() {
    if (completingRef.current || !codeRef.current || !sessionRef.current) return;
    completingRef.current = true;
    setBusy(true);
    setMessage(isArabic ? "جارٍ حفظ اتصال WhatsApp بأمان…" : "Securing the WhatsApp connection…");
    try {
      const response = await fetch("/api/marketing/integrations/whatsapp/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeRef.current,
          wabaId: sessionRef.current.wabaId,
          phoneNumberId: sessionRef.current.phoneNumberId,
          displayPhoneNumber: sessionRef.current.displayPhoneNumber,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { ok?: boolean };
      if (!response.ok || !payload.ok) throw new Error("connection_failed");
      setMessage(isArabic ? "تم ربط WhatsApp رسميًا. لم يتم إرسال أي رسالة." : "WhatsApp is officially connected. No message was sent.");
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      completingRef.current = false;
      setBusy(false);
      setMessage(isArabic ? "تعذر إكمال الربط. لم يتم إرسال أي رسالة ولم يتم كشف أي اعتماد." : "Connection could not be completed. No message was sent and no credential was exposed.");
    }
  }

  useEffect(() => {
    function receiveMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      const session = readSessionEvent(event.data);
      if (!session) return;
      sessionRef.current = session;
      void tryComplete();
    }
    window.addEventListener("message", receiveMessage);

    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: true, version: "v26.0" });
      setSdkReady(true);
    };
    if (window.FB) {
      window.fbAsyncInit();
    } else if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(script);
    }

    return () => window.removeEventListener("message", receiveMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  function startSignup() {
    if (!window.FB || !sdkReady || busy) return;
    codeRef.current = null;
    sessionRef.current = null;
    completingRef.current = false;
    setMessage(null);
    setBusy(true);
    window.FB.login((response) => {
      const code = response.authResponse?.code?.trim();
      if (!code) {
        setBusy(false);
        setMessage(isArabic ? "تم إلغاء أو تعذر تسجيل WhatsApp." : "WhatsApp signup was cancelled or could not start.");
        return;
      }
      codeRef.current = code;
      void tryComplete();
    }, {
      config_id: configurationId,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        feature: "whatsapp_embedded_signup",
        sessionInfoVersion: "3",
      },
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={startSignup}
        disabled={!sdkReady || busy}
        className="rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs text-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? (isArabic ? "جارٍ الربط…" : "Connecting…")
          : (isArabic ? "ربط WhatsApp الرسمي" : "Connect official WhatsApp")}
      </button>
      <p className="mt-2 text-[11px] leading-5 text-white/35">
        {isArabic
          ? "سيُفتح مسار Meta Embedded Signup. اختر حساب WhatsApp Business والرقم الحالي عبر مسار Coexistence؛ لا تحذف الرقم من تطبيق WhatsApp Business."
          : "Meta Embedded Signup will open. Select the existing WhatsApp Business account and number through Coexistence; do not remove the number from the WhatsApp Business app."}
      </p>
      {message ? <p className="mt-2 text-[11px] leading-5 text-amber-200/80">{message}</p> : null}
    </div>
  );
}
