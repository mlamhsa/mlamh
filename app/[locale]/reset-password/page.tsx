"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isArabic = locale === "ar";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage(
        isArabic
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."
          : "Password must be at least 8 characters long.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        isArabic
          ? "كلمتا المرور غير متطابقتين."
          : "Passwords do not match.",
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("[ResetPassword.updateUser]", error);
        setErrorMessage(
          isArabic
            ? "تعذر تحديث كلمة المرور. قد يكون الرابط منتهي الصلاحية، اطلب رابطًا جديدًا."
            : "Unable to update the password. The link may have expired; request a new one.",
        );
        return;
      }

      setDone(true);
    } catch (error) {
      console.error("[ResetPassword.handleSubmit]", error);
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
            {isArabic ? "تأمين الحساب" : "Secure Your Account"}
          </p>
          <h1 className="mt-3 text-3xl font-light">
            {isArabic ? "كلمة مرور جديدة" : "Create a new password"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/45">
            {isArabic
              ? "اختر كلمة مرور قوية جديدة لحسابك في ملامح."
              : "Choose a strong new password for your MLAMH account."}
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-5 text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-emerald-300" />
            <p className="mt-3 text-sm font-medium text-white/80">
              {isArabic ? "تم تحديث كلمة المرور" : "Password updated"}
            </p>
            <Link
              href={`/${locale}/login`}
              className="mt-4 inline-flex rounded-xl bg-gold px-5 py-3 text-sm font-medium text-black"
            >
              {isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
                {errorMessage}
              </div>
            ) : null}

            <PasswordInput
              value={password}
              onChange={setPassword}
              show={showPassword}
              label={isArabic ? "كلمة المرور الجديدة" : "New password"}
              isArabic={isArabic}
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPassword}
              label={isArabic ? "تأكيد كلمة المرور" : "Confirm password"}
              isArabic={isArabic}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPassword
                ? isArabic
                  ? "إخفاء كلمة المرور"
                  : "Hide password"
                : isArabic
                  ? "إظهار كلمة المرور"
                  : "Show password"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-gold py-4 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:opacity-60"
            >
              {loading
                ? isArabic
                  ? "جارٍ التحديث..."
                  : "Updating..."
                : isArabic
                  ? "تحديث كلمة المرور"
                  : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  label,
  isArabic,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  label: string;
  isArabic: boolean;
}) {
  return (
    <div className="relative">
      <LockKeyhole
        size={18}
        className={`absolute top-1/2 -translate-y-1/2 text-white/30 ${isArabic ? "right-4" : "left-4"}`}
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={show ? "text" : "password"}
        autoComplete="new-password"
        required
        minLength={8}
        placeholder={label}
        className={`w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${isArabic ? "pr-12 pl-4" : "pl-12 pr-4"}`}
      />
    </div>
  );
}
