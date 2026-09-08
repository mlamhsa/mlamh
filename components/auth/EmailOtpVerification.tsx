"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  email: string;
  accountType: "talent" | "publisher";
  intent: "actor" | "model" | "publisher" | "";
};

const RESEND_SECONDS = 45;

export function EmailOtpVerification({ locale, email, accountType, intent }: Props) {
  const router = useRouter();
  const isRtl = locale === "ar";
  const [token, setToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  function normalizeOtp(value: string) {
    return value.replace(/[^0-9]/g, "").slice(0, 6);
  }

  async function continueAfterVerification() {
    if (accountType === "publisher") {
      router.replace(`/${locale}/join/publisher`);
      return;
    }
    router.replace(`/${locale}/join/talent${intent ? `?intent=${intent}` : ""}`);
  }

  async function verify() {
    if (!email) {
      setError(isRtl ? "تعذر تحديد البريد الإلكتروني. ارجع إلى التسجيل وحاول مرة أخرى." : "We could not determine your email. Return to signup and try again.");
      return;
    }
    if (token.length !== 6) {
      setError(isRtl ? "أدخل رمز التحقق المكون من 6 أرقام." : "Enter the 6-digit verification code.");
      return;
    }

    setLoading(true); setError(""); setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (verifyError || !data.session) {
        setError(isRtl ? "الرمز غير صحيح أو انتهت صلاحيته. تحقق منه أو اطلب رمزًا جديدًا." : "That code is incorrect or expired. Check it or request a new code.");
        return;
      }
      setMessage(isRtl ? "تم تأكيد بريدك بنجاح." : "Your email has been verified.");
      await continueAfterVerification();
    } catch {
      setError(isRtl ? "تعذر تأكيد البريد الآن. تحقق من اتصالك وحاول مرة أخرى." : "We could not verify your email right now. Check your connection and try again.");
    } finally { setLoading(false); }
  }

  async function resend() {
    if (!email || secondsLeft > 0 || resending) return;
    setResending(true); setError(""); setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
      if (resendError) {
        setError(isRtl ? "تعذر إرسال رمز جديد الآن. حاول بعد قليل." : "We could not send a new code right now. Try again shortly.");
        return;
      }
      setToken("");
      setSecondsLeft(RESEND_SECONDS);
      setMessage(isRtl ? "أرسلنا رمزًا جديدًا إلى بريدك." : "We sent a new code to your email.");
    } catch {
      setError(isRtl ? "تعذر إرسال رمز جديد الآن." : "We could not send a new code right now.");
    } finally { setResending(false); }
  }

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 py-20 text-white">
      <section className="mx-auto w-full max-w-xl">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{isRtl ? "تأكيد البريد" : "EMAIL VERIFICATION"}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{isRtl ? "تحقق من بريدك الإلكتروني" : "Verify your email"}</h1>
          <p className="mt-4 text-sm leading-7 text-white/55">{isRtl ? "أرسلنا رمزًا مكونًا من 6 أرقام إلى:" : "We sent a 6-digit code to:"}</p>
          <p dir="ltr" className="mt-1 text-left text-sm font-medium text-white">{email || "—"}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <label htmlFor="email-otp" className="mb-2 block text-sm text-white/70">{isRtl ? "رمز التحقق" : "Verification code"} <span className="text-gold">*</span></label>
          <input
            id="email-otp"
            value={token}
            onChange={(event) => { setToken(normalizeOtp(event.currentTarget.value)); setError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") void verify(); }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            dir="ltr"
            className="min-h-16 w-full rounded-2xl border border-gold/30 bg-black/40 px-4 text-center text-3xl font-semibold tracking-[0.35em] text-white outline-none transition placeholder:text-white/20 focus:border-gold"
          />
          <p className="mt-2 text-xs text-white/35"><span className="text-gold">*</span> {isRtl ? "حقل مطلوب" : "Required field"}</p>

          {error ? <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
          {message ? <div role="status" className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}

          <button type="button" onClick={() => void verify()} disabled={loading || token.length !== 6} className="mt-5 min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-[#e0bd73] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? (isRtl ? "جارٍ التحقق..." : "Verifying...") : (isRtl ? "تأكيد الرمز والمتابعة" : "Verify and continue")}
          </button>

          <button type="button" onClick={() => void resend()} disabled={secondsLeft > 0 || resending} className="mt-3 min-h-11 w-full text-sm font-medium text-gold disabled:text-white/30">
            {resending ? (isRtl ? "جارٍ الإرسال..." : "Sending...") : secondsLeft > 0 ? (isRtl ? `إعادة الإرسال خلال ${secondsLeft} ثانية` : `Resend in ${secondsLeft}s`) : (isRtl ? "إعادة إرسال الرمز" : "Resend code")}
          </button>

          <div className="mt-4 rounded-2xl bg-white/[0.035] px-4 py-3 text-xs leading-6 text-white/45">{isRtl ? "لم تجد الرسالة؟ تحقق من Spam / Junk قبل طلب رمز جديد." : "Can't find the email? Check Spam / Junk before requesting a new code."}</div>

          <Link href={`/${locale}/join?type=${accountType}`} className="mt-5 block text-center text-sm text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white">{isRtl ? "تغيير البريد الإلكتروني" : "Change email address"}</Link>
        </div>
      </section>
    </main>
  );
}
