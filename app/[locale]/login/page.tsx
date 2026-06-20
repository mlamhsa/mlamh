"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();

  const [mode, setMode] = useState<"select" | "login">("select");
  const [role, setRole] = useState<"talent" | "publisher" | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRtl = locale === "ar";

  const text = {
    title: isRtl ? "مرحباً بك في ملامح" : "Welcome to MALAMIH",
    subtitle: isRtl
      ? "اختر نوع حسابك للمتابعة"
      : "Choose your account type to continue",

    talent: isRtl ? "أنا موهبة" : "I am Talent",
    publisher: isRtl ? "أنا شركة أو وكالة" : "I am a Company or Agency",

    login: isRtl ? "تسجيل الدخول" : "Login",
    register: isRtl ? "إنشاء حساب" : "Create Account",

    email: isRtl ? "البريد الإلكتروني" : "Email",
    password: isRtl ? "كلمة المرور" : "Password",

    back: isRtl ? "رجوع" : "Back",
    loading: isRtl ? "جاري الدخول..." : "Signing in...",

    invalid: isRtl ? "بيانات الدخول غير صحيحة." : "Invalid login credentials.",
    noProfile: isRtl
      ? "لم يتم العثور على ملف حساب لهذا المستخدم."
      : "No profile was found for this user.",
    wrongRole: isRtl
      ? "نوع الحساب لا يطابق الاختيار."
      : "Account type does not match your selection.",
  };

  function handleSelect(type: "talent" | "publisher") {
    setRole(type);
    setMode("login");
    setError("");
  }

  function handleRegister() {
    if (role === "publisher") {
      router.push(`/${locale}/register-publisher`);
      return;
    }

    router.push(`/${locale}/join`);
  }

  async function handleLogin() {
    setLoading(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError(text.invalid);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profileError || !profile?.role) {
      await supabase.auth.signOut();
      setError(text.noProfile);
      setLoading(false);
      return;
    }

    if (role && profile.role !== role) {
      await supabase.auth.signOut();
      setError(text.wrongRole);
      setLoading(false);
      return;
    }

    if (profile.role === "publisher") {
      router.push(`/${locale}/publisher-dashboard`);
      return;
    }

    if (profile.role === "talent") {
      router.push(`/${locale}/talent-dashboard`);
      return;
    }

    await supabase.auth.signOut();
    setError(text.noProfile);
    setLoading(false);
  }

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-screen items-center justify-center bg-black px-6 text-white"
    >
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-gold">
            MALAMIH
          </p>

          <h1 className="text-4xl font-light">{text.title}</h1>

          <p className="mt-3 text-sm leading-7 text-white/50">
            {text.subtitle}
          </p>
        </div>

        {mode === "select" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => handleSelect("talent")}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-5 text-white transition hover:border-gold/40 hover:bg-white/10"
            >
              {text.talent}
            </button>

            <button
              type="button"
              onClick={() => handleSelect("publisher")}
              className="w-full rounded-xl border border-gold/40 bg-gold/10 py-5 text-gold transition hover:border-gold hover:bg-gold/20"
            >
              {text.publisher}
            </button>
          </div>
        )}

        {mode === "login" && (
          <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6">
            <p className="text-center text-sm text-white/60">
              {role === "publisher" ? text.publisher : text.talent} —{" "}
              {text.login}
            </p>

            {error ? (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50"
              placeholder={text.email}
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50"
              placeholder={text.password}
            />

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-xl border border-gold bg-gold/10 py-4 text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? text.loading : text.login}
            </button>

            <button
              type="button"
              onClick={handleRegister}
              className="w-full text-center text-sm text-white/50 underline underline-offset-4 transition hover:text-gold"
            >
              {text.register}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("select");
                setRole(null);
                setError("");
              }}
              className="w-full text-center text-sm text-white/30 transition hover:text-white/60"
            >
              {text.back}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}