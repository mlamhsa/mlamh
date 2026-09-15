"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe2, KeyRound, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  email: string;
  accountType: string;
};

export function AccountPageClient({ locale, email, accountType }: Props) {
  const isArabic = locale === "ar";
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const otherLocale = locale === "ar" ? "en" : "ar";

  const accountTypeLabel =
    accountType === "talent"
      ? isArabic
        ? "موهبة"
        : "Talent"
      : accountType === "publisher"
        ? isArabic
          ? "ناشر"
          : "Publisher"
        : accountType || (isArabic ? "حساب ملامح" : "MLAMH account");

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(isArabic ? "تعذر تسجيل الخروج. حاول مرة أخرى." : "Unable to sign out. Please try again.");
        return;
      }
      window.location.assign(`/${locale}/login`);
    } catch (cause) {
      console.error("[AccountPage.signOut]", cause);
      setError(isArabic ? "تعذر تسجيل الخروج. حاول مرة أخرى." : "Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-black px-4 pb-28 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold">
              <UserRound size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gold">{isArabic ? "حساب ملامح" : "MLAMH Account"}</p>
              <h1 className="mt-1 text-3xl font-light">{isArabic ? "حسابي" : "My account"}</h1>
              <p className="mt-2 text-sm text-white/45">{isArabic ? "إعدادات الدخول والأمان واللغة." : "Sign-in, security and language settings."}</p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <Mail className="text-gold" size={20} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/40">{isArabic ? "البريد الإلكتروني" : "Email"}</p>
              <p dir="ltr" className="mt-1 truncate text-left text-sm text-white/85">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-5">
            <ShieldCheck className="text-gold" size={20} />
            <div>
              <p className="text-xs text-white/40">{isArabic ? "نوع الحساب" : "Account type"}</p>
              <p className="mt-1 text-sm text-white/85">{accountTypeLabel}</p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
          <Link
            href={`/${locale}/forgot-password?email=${encodeURIComponent(email)}`}
            className="flex items-center gap-3 border-b border-white/10 px-5 py-5 transition hover:bg-white/[0.04]"
          >
            <KeyRound className="text-gold" size={20} />
            <div className="flex-1">
              <p className="text-sm text-white/90">{isArabic ? "تغيير كلمة المرور" : "Change password"}</p>
              <p className="mt-1 text-xs text-white/40">{isArabic ? "سنرسل رابطًا آمنًا إلى بريدك." : "We'll send a secure link to your email."}</p>
            </div>
          </Link>

          <Link
            href={`/${otherLocale}/account`}
            className="flex items-center gap-3 px-5 py-5 transition hover:bg-white/[0.04]"
          >
            <Globe2 className="text-gold" size={20} />
            <div className="flex-1">
              <p className="text-sm text-white/90">{isArabic ? "اللغة" : "Language"}</p>
              <p className="mt-1 text-xs text-white/40">{isArabic ? "English" : "العربية"}</p>
            </div>
          </Link>
        </section>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-5 text-sm text-red-200 transition hover:bg-red-400/10 disabled:opacity-60"
        >
          <LogOut size={18} />
          {signingOut ? (isArabic ? "جارٍ تسجيل الخروج..." : "Signing out...") : isArabic ? "تسجيل الخروج" : "Sign out"}
        </button>
      </div>
    </main>
  );
}
