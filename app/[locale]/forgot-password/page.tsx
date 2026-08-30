"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isArabic = locale === "ar";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?locale=${locale}&mode=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        console.error("[ForgotPassword.resetPasswordForEmail]", error);
        setErrorMessage(
          isArabic
            ? "تعذر إرسال رابط إعادة التعيين. حاول مرة أخرى."
            : "Unable to send the reset link. Please try again.",
        );
        return;
      }

      setSent(true);
    } catch (error) {
      console.error("[ForgotPassword.handleSubmit]", error);
      setErrorMessage(
        isArabic
          ? "حدث خطأ غير متوقع. حاول مرة أخرى."
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative flex min-h-[calc(100dvh-4rem)] items-start justify-center overflow-hidden bg-black px-4 py-6 text-white sm:items-center sm:px-6 sm:py-16"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08] text-gold">
            <Sparkles size={20} />
          </div>
          <p className="text-xs text-gold">
            {isArabic ? "استعادة الحساب" : "Account Recovery"}
          </p>
          <h1 className="mt-3 text-3xl font-light">
            {isArabic ? "إعادة تعيين كلمة المرور" : "Reset your password"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/45">
            {isArabic
              ? "أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لتعيين كلمة مرور جديدة."
              : "Enter your email and we'll send you a secure link to set a new password."}
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-gold/20 bg-gold/[0.06] p-5 text-center">
            <Mail className="mx-auto h-6 w-6 text-gold" />
            <p className="mt-3 text-sm font-medium text-white/80">
              {isArabic ? "تحقق من بريدك الإلكتروني" : "Check your email"}
            </p>
            <p className="mt-2 text-xs leading-6 text-white/45">
              {isArabic
                ? "إذا كان البريد مرتبطًا بحساب ملامح، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور."
                : "If this email is linked to a MLAMH account, you'll receive a password reset link."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
                {errorMessage}
              </div>
            ) : null}

            <div className="relative">
              <Mail
                size={18}
                className={`absolute top-1/2 -translate-y-1/2 text-white/30 ${isArabic ? "right-4" : "left-4"}`}
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                dir="ltr"
                required
                disabled={loading}
                placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                className={`w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-left text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${isArabic ? "pr-12 pl-4" : "pl-12 pr-4"}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gold py-4 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:opacity-60"
            >
              {loading
                ? isArabic
                  ? "جارٍ الإرسال..."
                  : "Sending..."
                : isArabic
                  ? "إرسال رابط إعادة التعيين"
                  : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-white/10 pt-5 text-center">
          <Link href={`/${locale}/login`} className="text-sm text-gold transition hover:text-gold-soft">
            {isArabic ? "العودة إلى تسجيل الدخول" : "Back to sign in"}
          </Link>
        </div>
      </div>
    </main>
  );
}
