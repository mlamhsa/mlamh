"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  email: string;
  accountType: "talent" | "publisher";
};

const RESEND_SECONDS = 45;

function callbackUrl(locale: "ar" | "en", accountType: "talent" | "publisher") {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("locale", locale);
  url.searchParams.set("mode", "signup");
  url.searchParams.set("type", accountType);
  url.searchParams.set("provider", "email");
  return url.toString();
}

export function EmailLinkVerification({ locale, email, accountType }: Props) {
  const isRtl = locale === "ar";
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(
      () => setSecondsLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function resend() {
    if (!email || secondsLeft > 0 || resending) return;
    setResending(true);
    setError("");
    setMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: callbackUrl(locale, accountType) },
      });

      if (resendError) {
        setError(
          isRtl
            ? "تعذر إرسال رسالة تأكيد جديدة الآن. حاول بعد قليل."
            : "We could not send a new confirmation email right now. Try again shortly.",
        );
        return;
      }

      setSecondsLeft(RESEND_SECONDS);
      setMessage(
        isRtl
          ? "أرسلنا رسالة تأكيد جديدة. افتحها واضغط رابط تأكيد البريد."
          : "We sent a new confirmation email. Open it and click the confirmation link.",
      );
    } catch {
      setError(
        isRtl
          ? "تعذر إرسال رسالة تأكيد جديدة الآن."
          : "We could not send a new confirmation email right now.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 py-20 text-white">
      <section className="mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {isRtl ? "تأكيد البريد" : "EMAIL VERIFICATION"}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {isRtl ? "تحقق من بريدك الإلكتروني" : "Verify your email"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/55">
            {isRtl
              ? "أرسلنا لك رسالة تأكيد. افتح الرسالة واضغط على رابط تأكيد البريد، وبعدها سنعيدك مباشرة إلى ملامح."
              : "We sent you a confirmation email. Open it and click the confirmation link, then we’ll bring you straight back to MLAMH."}
          </p>
          <p dir="ltr" className="mt-2 text-center text-sm font-medium text-white">
            {email || "—"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
          <div className="rounded-2xl border border-gold/20 bg-gold/[0.05] px-5 py-5 text-center">
            <p className="text-sm font-medium text-white/80">
              {isRtl ? "الخطوة التالية" : "Next step"}
            </p>
            <p className="mt-2 text-sm leading-7 text-white/50">
              {isRtl
                ? "اذهب إلى بريدك واضغط «تأكيد البريد الإلكتروني». لا تحتاج لإدخال رمز داخل ملامح."
                : "Go to your inbox and click “Confirm email address”. You do not need to enter a code in MLAMH."}
            </p>
          </div>

          {error ? (
            <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {message ? (
            <div role="status" className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void resend()}
            disabled={secondsLeft > 0 || resending}
            className="mt-5 min-h-12 w-full rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 text-sm font-medium text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.02] disabled:text-white/30"
          >
            {resending
              ? isRtl ? "جارٍ الإرسال..." : "Sending..."
              : secondsLeft > 0
                ? isRtl ? `إعادة الإرسال خلال ${secondsLeft} ثانية` : `Resend in ${secondsLeft}s`
                : isRtl ? "إعادة إرسال رسالة التأكيد" : "Resend confirmation email"}
          </button>

          <div className="mt-4 rounded-2xl bg-white/[0.035] px-4 py-3 text-xs leading-6 text-white/45">
            {isRtl
              ? "لم تجد الرسالة؟ تحقق من Spam / Junk قبل طلب رسالة جديدة."
              : "Can't find the email? Check Spam / Junk before requesting a new one."}
          </div>

          <Link
            href={`/${locale}/join?type=${accountType}`}
            className="mt-5 block text-center text-sm text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white"
          >
            {isRtl ? "تغيير البريد الإلكتروني" : "Change email address"}
          </Link>
        </div>
      </section>
    </main>
  );
}
