"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRtl = locale === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const errorParam = searchParams.get("error");

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
    error: isRtl ? "تعذر تسجيل الدخول." : "Login failed.",
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("mlamh_login_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    if (rememberEmail && email) {
      localStorage.setItem("mlamh_login_email", email);
    } else {
      localStorage.removeItem("mlamh_login_email");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      setErrorMessage(error?.message || text.error);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profile?.account_type === "talent") {
      router.replace(`/${locale}/talent-dashboard`);
      router.refresh();
      return;
    }

    if (profile?.account_type === "publisher") {
      router.replace(`/${locale}/publisher-dashboard`);
      router.refresh();
      return;
    }

    if (profile?.account_type === "admin") {
      router.replace("/admin");
      router.refresh();
      return;
    }

    await supabase.auth.signOut();
    router.replace(`/${locale}/login?error=no_profile`);
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

          <p className="text-xs uppercase tracking-[0.35em] text-gold">
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
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="accent-gold"
              />
              {text.remember}
            </label>

            <button type="button" className="text-white/40 transition hover:text-gold">
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
          <button
            type="button"
            onClick={() => router.push(`/${locale}/join`)}
            className="text-gold transition hover:text-gold-soft"
          >
            {text.create}
          </button>
        </div>
      </div>
    </main>
  );
}