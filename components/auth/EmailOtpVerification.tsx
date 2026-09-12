"use client";

import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  email: string;
  accountType: "talent" | "publisher";
  intent: "actor" | "model" | "publisher" | "";
};

const RESEND_SECONDS = 45;

export function EmailOtpVerification({ locale, email, accountType, intent }: Props) {
  const isRtl = locale === "ar";
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function resend() {
    if (!email || secondsLeft > 0 || resending) return;
    setResending(true);
    setError("");
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("locale", locale);
      callback.searchParams.set("mode", "signup");
      callback.searchParams.set("type", accountType);
      callback.searchParams.set("provider", "email");
      if (intent) callback.searchParams.set("intent", intent);

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: callback.toString() },
      });

      if (resendError) {
        setError(isRtl ? "تعذر إرسال رسالة تأكيد جديدة الآن. حاول بعد قليل." : "We couldn't send a new confirmation email right now. Try again shortly.");
        return;
      }

      setSecondsLeft(RESEND_SECONDS);
      setMessage(isRtl ? "أرسلنا رسالة تأكيد جديدة إلى بريدك." : "We sent a new confirmation email to your inbox.");
    } catch {
      setError(isRtl ? "تعذر إرسال رسالة تأكيد جديدة الآن." : "We couldn't send a new confirmation email right now.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 pb-28 pt-36 text-white sm:pt-40 lg:pb-16 lg:pt-32">
      <section className="mx-auto w-full max-w-xl">
        <div className="mb-6 text-center sm:mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{isRtl ? "تأكيد البريد" : "EMAIL VERIFICATION"}</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{isRtl ? "تحقق من بريدك الإلكتروني" : "Check your email"}</h1>
          <p className="mt-3 text-sm leading-7 text-white/55">
            {isRtl ? "أرسلنا لك رسالة تأكيد. افتح الرسالة واضغط على رابط تأكيد البريد لإكمال إنشاء حسابك." : "We sent you a confirmation email. Open it and tap the confirmation link to finish creating your account."}
          </p>
          <p dir="ltr" className="mt-2 text-center text-sm font-medium text-white">{email || "—"}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-7">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold">
            <Mail size={28} aria-hidden="true" />
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={19} aria-hidden="true" />
              <p className="text-sm leading-7 text-white/60">{isRtl ? "افتح رسالة ملامح الموجودة في بريدك الإلكتروني." : "Open the MLAMH message in your inbox."}</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <CheckCircle2 className="mt-0.5 shrink-0 text-gold" size={19} aria-hidden="true" />
              <p className="text-sm leading-7 text-white/60">{isRtl ? "اضغط على «تأكيد البريد الإلكتروني». سنعيدك تلقائيًا إلى ملامح ونكمل حسابك." : "Tap “Confirm email address”. We'll return you to MLAMH automatically and finish setting up your account."}</p>
            </div>
          </div>

          {error ? <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          {message ? <div role="status" className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}

          <button type="button" onClick={() => void resend()} disabled={secondsLeft > 0 || resending || !email} className="mt-6 min-h-12 w-full rounded-2xl border border-gold/25 px-5 text-sm font-semibold text-gold transition hover:bg-gold/[0.06] disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30">
            {resending
              ? (isRtl ? "جارٍ الإرسال..." : "Sending...")
              : secondsLeft > 0
                ? (isRtl ? `إعادة إرسال رسالة التأكيد خلال ${secondsLeft} ثانية` : `Resend confirmation in ${secondsLeft}s`)
                : (isRtl ? "إعادة إرسال رسالة التأكيد" : "Resend confirmation email")}
          </button>

          <div className="mt-4 rounded-2xl bg-white/[0.035] px-4 py-3 text-xs leading-6 text-white/45">
            {isRtl ? "لم تجد الرسالة؟ تحقق من البريد غير المرغوب فيه أو Spam قبل إعادة الإرسال." : "Can't find the message? Check Spam / Junk before resending."}
          </div>

          <Link href={`/${locale}/join?type=${accountType}`} className="mt-5 block text-center text-sm text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white">
            {isRtl ? "تغيير البريد الإلكتروني" : "Change email address"}
          </Link>
        </div>
      </section>
    </main>
  );
}
