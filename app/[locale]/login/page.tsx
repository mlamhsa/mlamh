"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";

  const [email, setEmail] = useState(() => {
    const signupEmail =
      searchParams.get("email")?.trim();
  
    if (signupEmail) {
      return signupEmail;
    }
  
    if (typeof window === "undefined") {
      return "";
    }
  
    return localStorage.getItem("mlamh_login_email") ?? "";
  });
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
  
    return Boolean(localStorage.getItem("mlamh_login_email"));
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const errorParam = searchParams.get("error");

  const messageParam = searchParams.get("message");

  const isVerifyEmail =
    messageParam === "verify_email";

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
    socialSoon: isRtl ? "تسجيل Google قريباً" : "Google sign-in coming soon",
    error: isRtl
  ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
  : "The email or password is incorrect.",
  };

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
  
    setLoading(true);
    setErrorMessage("");
  
    try {
      if (rememberEmail && email) {
        localStorage.setItem(
          "mlamh_login_email",
          email.trim(),
        );
      } else {
        localStorage.removeItem(
          "mlamh_login_email",
        );
      }
  
      const signInResult = await Promise.race([
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(
              new Error("LOGIN_TIMEOUT"),
            );
          }, 12000);
        }),
      ]);
      
      const { data, error } = signInResult;
  
      if (error || !data.user) {
        console.error(
          "[LoginPage.signIn]",
          error,
        );
  
        setErrorMessage(text.error);
        return;
      }
  
      window.location.assign(
        `/${locale}/dashboard-router`,
      );
    } catch (error) {
      console.error(
        "[LoginPage.handleSubmit]",
        error,
      );
    
      if (
        error instanceof Error &&
        error.message === "LOGIN_TIMEOUT"
      ) {
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
            {isRtl ? "خطوة أخيرة" : "One Last Step"}
          </p>
  
          <h1 className="mt-4 text-4xl font-light">
            {isRtl
              ? "تحقق من بريدك الإلكتروني"
              : "Check Your Email"}
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
  
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/15 bg-gold/[0.06] p-4 text-start">
            <CheckCircle2
              size={19}
              className="mt-1 shrink-0 text-gold"
            />
  
            <p className="text-sm leading-6 text-white/60">
              {isRtl
                ? "لن تتمكن من تسجيل الدخول قبل تأكيد بريدك الإلكتروني."
                : "You won't be able to sign in until your email address is confirmed."}
            </p>
          </div>
  
          <p className="mt-6 text-xs leading-6 text-white/35">
            {isRtl
              ? "لم تجد الرسالة؟ تحقق من البريد غير المرغوب فيه (Spam)."
              : "Can't find the email? Check your spam or junk folder."}
          </p>
  
          <div className="mt-8 border-t border-white/10 pt-6">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-gold transition hover:text-gold-soft"
            >
              {isRtl
                ? "العودة إلى تسجيل الدخول"
                : "Back to Sign In"}
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

          <p className="mt-3 text-sm leading-7 text-white/45">
            {text.subtitle}
          </p>
        </div>

        {errorParam || errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
            {errorMessage || text.error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              size={18}
              className="absolute top-1/2 -translate-y-1/2 text-white/30"
              style={isRtl ? { right: 16 } : { left: 16 }}
            />

            <input
              value={email}
              name="email"
aria-label={text.email}
disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
              className={`w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${
                isRtl ? "pr-12 pl-4" : "pl-12 pr-4"
              }`}
              placeholder={text.email}
            />
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
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className={`w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50 ${
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
  className="absolute top-1/2 -translate-y-1/2 text-white/35 transition hover:text-gold"
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
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="accent-gold"
              />
              {text.remember}
            </label>

            <button
  type="button"
  disabled
  className="cursor-not-allowed text-white/25"
>
  {text.forgot}
</button>
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
            disabled
            className="w-full rounded-2xl border border-white/10 bg-white/[0.025] py-4 text-sm text-white/35"
          >
            {text.socialSoon}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
          {text.join}{" "}
          <Link
  href={`/${locale}/join`}
  className="text-gold transition hover:text-gold-soft"
>
  {text.create}
</Link>
        </div>
      </div>
    </main>
  );
}