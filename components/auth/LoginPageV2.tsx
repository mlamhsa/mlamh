"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  initialEmail?: string;
  errorCode?: string;
  messageCode?: string;
};

type OAuthProvider = "google" | "apple";

export function LoginPageV2({ locale, initialEmail = "", errorCode, messageCode }: Props) {
  const isArabic = locale === "ar";
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"password" | OAuthProvider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      return;
    }

    const saved = window.localStorage.getItem("mlamh_login_email") ?? "";
    setEmail(saved);
    setRememberEmail(Boolean(saved));
  }, [initialEmail]);

  const copy = {
    eyebrow: isArabic ? "دخول ملامح" : "MLAMH ACCESS",
    title: isArabic ? "مرحبًا بعودتك" : "Welcome back",
    subtitle: isArabic
      ? "سجّل الدخول للوصول إلى حسابك ولوحة التحكم الخاصة بك."
      : "Sign in to access your account and dashboard.",
    email: isArabic ? "البريد الإلكتروني" : "Email",
    password: isArabic ? "كلمة المرور" : "Password",
    remember: isArabic ? "تذكر البريد" : "Remember email",
    forgot: isArabic ? "نسيت كلمة المرور؟" : "Forgot password?",
    signIn: isArabic ? "تسجيل الدخول" : "Sign in",
    signingIn: isArabic ? "جارٍ تسجيل الدخول..." : "Signing in...",
    google: isArabic ? "المتابعة باستخدام Google" : "Continue with Google",
    apple: isArabic ? "المتابعة باستخدام Apple" : "Continue with Apple",
    divider: isArabic ? "أو" : "OR",
    noAccount: isArabic ? "ليس لديك حساب؟" : "Don’t have an account?",
    join: isArabic ? "انضم إلى ملامح" : "Join MLAMH",
    credentialError: isArabic
      ? "تعذر تسجيل الدخول بهذه البيانات. إذا أنشأت حسابك سابقًا باستخدام Google أو Apple فاستخدم الطريقة نفسها، أو استخدم «نسيت كلمة المرور؟» لحساب البريد الإلكتروني."
      : "We couldn’t sign you in with those credentials. If you created your account with Google or Apple, use the same provider, or use Forgot password for an email account.",
    accountExistsTitle: isArabic ? "لديك حساب ملامح بالفعل" : "You already have an MLAMH account",
    accountExistsBody: isArabic
      ? "هذا البريد مرتبط بحساب موجود. لم ننشئ حسابًا جديدًا أو نغيّر حسابك الحالي. استخدم طريقة تسجيل الدخول التي سجلت بها سابقًا، أو «نسيت كلمة المرور؟» إذا كان حسابك بالبريد الإلكتروني."
      : "This email is already linked to an existing account. We did not create a second account or change your current account. Use the sign-in method you originally used, or Forgot password for an email account.",
  };

  async function signInWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    setLoading("password");
    setError("");

    try {
      if (rememberEmail && cleanEmail) {
        window.localStorage.setItem("mlamh_login_email", cleanEmail);
      } else {
        window.localStorage.removeItem("mlamh_login_email");
      }

      const supabase = createBrowserSupabaseClient();
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email: cleanEmail, password }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 12000);
        }),
      ]);

      if (result.error || !result.data.user) {
        console.error("[LoginPageV2.password]", result.error);
        setError(copy.credentialError);
        return;
      }

      window.location.assign(`/${locale}/dashboard-router`);
    } catch (cause) {
      console.error("[LoginPageV2.password]", cause);
      setError(
        isArabic
          ? "تعذر إكمال تسجيل الدخول حاليًا. حاول مرة أخرى."
          : "Sign-in could not be completed. Please try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  async function signInWithProvider(provider: OAuthProvider) {
    if (loading) return;
    setLoading(provider);
    setError("");

    try {
      const supabase = createBrowserSupabaseClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("locale", locale);
      callback.searchParams.set("provider", provider);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });

      if (oauthError) {
        console.error(`[LoginPageV2.${provider}]`, oauthError);
        setError(
          isArabic
            ? `تعذر تسجيل الدخول باستخدام ${provider === "google" ? "Google" : "Apple"}. حاول مرة أخرى.`
            : `Unable to sign in with ${provider === "google" ? "Google" : "Apple"}. Please try again.`,
        );
        setLoading(null);
      }
    } catch (cause) {
      console.error(`[LoginPageV2.${provider}]`, cause);
      setError(
        isArabic
          ? "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
          : "An error occurred while signing in. Please try again.",
      );
      setLoading(null);
    }
  }

  const legacyVerifyMessage = messageCode === "verify_email";
  const accountExists = errorCode === "account_exists";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-24 text-white sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08] text-gold">
            <Sparkles size={20} />
          </div>
          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">{copy.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-light">{copy.title}</h1>
          <p className="mt-3 text-sm leading-7 text-white/45">{copy.subtitle}</p>
        </header>

        {legacyVerifyMessage ? (
          <div className="mb-5 rounded-2xl border border-gold/25 bg-gold/[0.07] p-4 text-sm leading-7 text-white/70">
            <p>
              {isArabic
                ? "أرسلنا رمز تحقق مكوّنًا من 6 أرقام إلى بريدك الإلكتروني. أدخل الرمز لإكمال التحقق."
                : "We sent a 6-digit verification code to your email. Enter it to complete verification."}
            </p>
            {email ? (
              <Link
                href={`/${locale}/join/verify-email?email=${encodeURIComponent(email)}&type=talent`}
                className="mt-3 inline-flex text-gold transition hover:text-gold-soft"
              >
                {isArabic ? "إدخال رمز التحقق" : "Enter verification code"}
              </Link>
            ) : null}
          </div>
        ) : null}

        {accountExists ? (
          <div role="status" className="mb-5 rounded-2xl border border-gold/30 bg-gold/[0.07] px-4 py-4 text-sm leading-7 text-white/70">
            <p className="font-medium text-white">{copy.accountExistsTitle}</p>
            <p className="mt-1">{copy.accountExistsBody}</p>
          </div>
        ) : null}

        {(errorCode && !accountExists) || error ? (
          <div role="alert" className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm leading-6 text-red-200">
            {error || copy.credentialError}
          </div>
        ) : null}

        <form onSubmit={(event) => void signInWithPassword(event)} className="space-y-3">
          <div className="relative">
            <Mail
              size={18}
              className="absolute top-1/2 -translate-y-1/2 text-white/30"
              style={isArabic ? { right: 16 } : { left: 16 }}
            />
            <input
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir="ltr"
              required
              disabled={Boolean(loading)}
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder={copy.email}
              aria-label={copy.email}
              className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-left text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${isArabic ? "pr-12 pl-4" : "pl-12 pr-4"}`}
            />
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute top-1/2 -translate-y-1/2 text-white/30"
              style={isArabic ? { right: 16 } : { left: 16 }}
            />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={Boolean(loading)}
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              placeholder={copy.password}
              aria-label={copy.password}
              className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${isArabic ? "pr-12 pl-12" : "pl-12 pr-12"}`}
            />
            <button
              type="button"
              disabled={Boolean(loading)}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? (isArabic ? "إخفاء كلمة المرور" : "Hide password") : isArabic ? "إظهار كلمة المرور" : "Show password"}
              className="absolute top-1/2 -translate-y-1/2 text-white/35 transition hover:text-gold"
              style={isArabic ? { left: 16 } : { right: 16 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-1 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-white/45">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(event) => setRememberEmail(event.currentTarget.checked)}
                className="accent-[#c8a96a]"
              />
              <span>{copy.remember}</span>
            </label>
            <Link href={`/${locale}/forgot-password`} className="text-gold transition hover:text-gold-soft">
              {copy.forgot}
            </Link>
          </div>

          <button
            type="submit"
            disabled={Boolean(loading)}
            className="min-h-14 w-full rounded-2xl bg-gold px-5 text-sm font-semibold text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading === "password" ? copy.signingIn : copy.signIn}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-[11px] text-white/30">
          <span className="h-px flex-1 bg-white/10" />
          <span>{copy.divider}</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void signInWithProvider("google")}
            disabled={Boolean(loading)}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.03] px-5 text-sm font-medium text-white transition hover:border-gold/35 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-black">G</span>
            <span>{loading === "google" ? (isArabic ? "جارٍ التحويل..." : "Redirecting...") : copy.google}</span>
          </button>

          <button
            type="button"
            onClick={() => void signInWithProvider("apple")}
            disabled={Boolean(loading)}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.22.07 2.07.67 2.78.72 1.06-.21 2.08-.82 3.21-.74 1.35.11 2.36.64 3.03 1.6-2.78 1.67-2.12 5.33.43 6.36-.51 1.35-1.17 2.7-2.45 4.04zM12.03 7.25C11.88 5.25 13.52 3.6 15.38 3.5c.26 2.31-2.09 4.03-3.35 3.75z" />
            </svg>
            <span>{loading === "apple" ? (isArabic ? "جارٍ التحويل..." : "Redirecting...") : copy.apple}</span>
          </button>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
          {copy.noAccount}{" "}
          <Link href={`/${locale}/join`} className="text-gold transition hover:text-gold-soft">
            {copy.join}
          </Link>
        </div>
      </div>
    </main>
  );
}
