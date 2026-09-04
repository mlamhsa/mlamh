"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";

import {
  createBrowserSupabaseClient,
  supabase,
} from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";
  const emailInputRef = useRef<HTMLInputElement>(null);

  const signupEmail = searchParams.get("email")?.trim() ?? "";
  const [email, setEmail] = useState(signupEmail);
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (signupEmail) {
      setEmail(signupEmail);
      return;
    }

    const savedEmail = localStorage.getItem("mlamh_login_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    } else {
      setRememberEmail(false);
    }
  }, [signupEmail]);

  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");
  const isVerifyEmail = messageParam === "verify_email";

  function getEmailProviderUrl(emailAddress: string) {
    const domain = emailAddress.split("@")[1]?.toLowerCase();

    if (!domain) return null;
    if (domain === "gmail.com") return "https://mail.google.com/";

    if (
      domain === "outlook.com" ||
      domain === "hotmail.com" ||
      domain === "live.com"
    ) {
      return "https://outlook.live.com/mail/";
    }

    if (
      domain === "icloud.com" ||
      domain === "me.com" ||
      domain === "mac.com"
    ) {
      return "https://www.icloud.com/mail/";
    }

    return null;
  }

  const text = {
    eyebrow: isRtl ? "دخول ملامح" : "MLAMH Access",
    title: isRtl ? "مرحباً بعودتك" : "Welcome Back",
    subtitle: isRtl
      ? "سجّل الدخول للوصول إلى لوحة التحكم الخاصة بك."
      : "Sign in to access your workspace.",
    email: isRtl ? "البريد الإلكتروني" : "Email",
    password: isRtl ? "كلمة المرور" : "Password",
    remember: isRtl ? "تذكر البريد" : "Remember email",
    forgot: isRtl ? "نسيت كلمة المرور؟" : "Forgot password?",
    login: isRtl ? "تسجيل الدخول" : "Sign In",
    loading: isRtl ? "جارٍ الدخول..." : "Signing in...",
    join: isRtl ? "ليس لديك حساب؟" : "Don’t have an account?",
    create: isRtl ? "انضم إلى ملامح" : "Join MLAMH",
    google: isRtl ? "المتابعة باستخدام Google" : "Continue with Google",
    credentialError: isRtl
      ? "تعذر تسجيل الدخول بهذه البيانات. إذا أنشأت حسابك باستخدام Google، استخدم «المتابعة باستخدام Google» بالأسفل. وإلا تحقق من البريد الإلكتروني وكلمة المرور."
      : "We couldn’t sign you in with those credentials. If you created your account with Google, use “Continue with Google” below. Otherwise, check your email and password.",
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (rememberEmail && email) {
        localStorage.setItem("mlamh_login_email", email.trim());
      } else {
        localStorage.removeItem("mlamh_login_email");
      }

      const signInResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 12000);
        }),
      ]);

      const { data, error } = signInResult;

      if (error || !data.user) {
        console.error("[LoginPage.signIn]", error);
        setErrorMessage(text.credentialError);
        return;
      }

      window.location.assign(`/${locale}/dashboard-router`);
    } catch (error) {
      console.error("[LoginPage.handleSubmit]", error);

      if (error instanceof Error && error.message === "LOGIN_TIMEOUT") {
        setErrorMessage(
          isRtl
            ? "تعذر إكمال تسجيل الدخول. حاول مرة أخرى."
            : "Sign-in could not be completed. Please try again.",
        );
        return;
      }

      setErrorMessage(
        isRtl
          ? "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
          : "An error occurred while signing in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setErrorMessage("");

    try {
      const redirectTo = `${window.location.origin}/auth/callback?locale=${locale}`;
      const oauthSupabase = createBrowserSupabaseClient();

      const { error } = await oauthSupabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        console.error("[LoginPage.googleSignIn]", error);
        setErrorMessage(
          isRtl
            ? "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى."
            : "Unable to sign in with Google. Please try again.",
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("[LoginPage.handleGoogleSignIn]", error);
      setErrorMessage(
        isRtl
          ? "حدث خطأ أثناء تسجيل الدخول باستخدام Google."
          : "An error occurred while signing in with Google.",
      );
      setLoading(false);
    }
  }

  if (isVerifyEmail) {
    return (
      <main
        dir={isRtl ? "rtl" : "ltr"}
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-24 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08] text-gold">
            <Mail size={24} />
          </div>

          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "تأكيد حسابك" : "Confirm Your Account"}
          </p>

          <h1 className="mt-4 text-4xl font-light">
            {isRtl ? "تحقق من بريدك الإلكتروني" : "Check Your Email"}
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/50">
            {isRtl
              ? "أرسلنا لك رسالة تحتوي على رابط تأكيد الحساب. افتح بريدك واضغط على رابط التأكيد لإكمال إنشاء حسابك في ملامح."
              : "We've sent you an email with a confirmation link. Open the email and confirm your address to complete your MLAMH account."}
          </p>

          {email ? (
            <div
              dir="ltr"
              className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white/80"
            >
              {email}
            </div>
          ) : null}

          {email && getEmailProviderUrl(email) ? (
            <a
              href={getEmailProviderUrl(email) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gold py-4 text-sm font-medium text-black transition hover:bg-[#e0bd73]"
            >
              {isRtl ? "الذهاب إلى بريدك الإلكتروني" : "Open Your Email"}
            </a>
          ) : null}

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/15 bg-gold/[0.06] p-4 text-start">
            <CheckCircle2 size={19} className="mt-1 shrink-0 text-gold" />
            <p className="text-sm leading-6 text-white/60">
              {isRtl
                ? "لن تتمكن من تسجيل الدخول قبل تأكيد بريدك الإلكتروني."
                : "You won't be able to sign in until your email address is confirmed."}
            </p>
          </div>

          <p className="mt-6 text-xs leading-6 text-white/35">
            {isRtl
              ? "لم تجد الرسالة؟ تحقق من البريد غير المرغوب فيه، أو انتظر قليلًا ثم حدّث بريدك."
              : "Can't find the email? Check your spam folder, wait a moment, then refresh your inbox."}
          </p>

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-gold transition hover:text-gold-soft"
            >
              {isRtl ? "العودة إلى تسجيل الدخول" : "Back to Sign In"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 py-24 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

      <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08] text-gold">
            <Sparkles size={20} />
          </div>

          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
            {text.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-light">{text.title}</h1>
          <p className="mt-3 text-sm leading-7 text-white/45">{text.subtitle}</p>
        </div>

        {errorParam || errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm leading-6 text-red-200">
            {errorMessage || text.credentialError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail
              size={18}
              className="absolute top-1/2 -translate-y-1/2 text-white/30"
              style={isRtl ? { right: 16 } : { left: 16 }}
            />

            <input
              ref={emailInputRef}
              value={email}
              name="email"
              aria-label={text.email}
              disabled={loading}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir="ltr"
              required
              className={`${styles.darkField} w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-left text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${
                isRtl ? "pr-12 pl-20" : "pl-12 pr-20"
              }`}
              placeholder={text.email}
            />

            {email ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail("");
                  localStorage.removeItem("mlamh_login_email");
                  requestAnimationFrame(() => emailInputRef.current?.focus());
                }}
                className="absolute top-1/2 -translate-y-1/2 text-xs text-gold transition hover:text-gold-soft disabled:opacity-50"
                style={isRtl ? { left: 16 } : { right: 16 }}
              >
                {isRtl ? "تغيير" : "Change"}
              </button>
            ) : null}
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute top-1/2 -translate-y-1/2 text-white/30"
              style={isRtl ? { right: 16 } : { left: 16 }}
            />

            <input
              value={password}
              name="password"
              aria-label={text.password}
              disabled={loading}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className={`${styles.darkField} w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${
                isRtl ? "pr-12 pl-12" : "pl-12 pr-12"
              }`}
              placeholder={text.password}
            />

            <button
              type="button"
              disabled={loading}
              aria-label={
                showPassword
                  ? isRtl
                    ? "إخفاء كلمة المرور"
                    : "Hide password"
                  : isRtl
                    ? "إظهار كلمة المرور"
                    : "Show password"
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-white/65 transition hover:text-gold disabled:opacity-40"
              style={isRtl ? { left: 16 } : { right: 16 }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-white/45">
              <input
                type="checkbox"
                disabled={loading}
                checked={rememberEmail}
                onChange={(event) => setRememberEmail(event.target.checked)}
                className="accent-gold"
              />
              {text.remember}
            </label>

            <Link
              href={`/${locale}/forgot-password`}
              className="text-white/45 transition hover:text-gold"
            >
              {text.forgot}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gold py-4 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:opacity-60"
          >
            {loading ? text.loading : text.login}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-5 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
              <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
            </svg>
            <span>{text.google}</span>
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
          {text.join}{" "}
          <Link href={`/${locale}/join`} className="text-gold transition hover:text-gold-soft">
            {text.create}
          </Link>
        </div>
      </div>
    </main>
  );
}
