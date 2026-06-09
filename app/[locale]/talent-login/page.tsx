import Link from "next/link";
import { notFound } from "next/navigation";
import {
  signInTalentAction,
  signUpTalentAction,
} from "@/lib/actions/talent-auth";
import { isValidLocale, type Locale } from "@/lib/i18n";

export const metadata = {
  title: "Talent Login — MLAMH",
};

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string }>;
};

function getErrorMessage(error?: string, isAr = false) {
  if (!error) return null;

  const decoded = decodeURIComponent(error);

  if (decoded === "missing_credentials") {
    return isAr
      ? "يرجى إدخال البريد الإلكتروني وكلمة المرور."
      : "Please enter email and password.";
  }

  if (decoded === "check_email_or_sign_in") {
    return isAr
      ? "تم إنشاء الحساب. إذا كان التحقق من البريد مفعّلًا، يرجى تأكيد البريد ثم تسجيل الدخول."
      : "Account created. If email confirmation is enabled, confirm your email then sign in.";
  }

  if (
    decoded.toLowerCase().includes("invalid login credentials")
  ) {
    return isAr
      ? "بيانات الدخول غير صحيحة. تحقق من البريد وكلمة المرور."
      : "Invalid login credentials. Check your email and password.";
  }

  if (
    decoded.toLowerCase().includes("email not confirmed")
  ) {
    return isAr
      ? "البريد الإلكتروني غير مؤكد. فعّل البريد من Supabase أو عطّل تأكيد البريد أثناء التطوير."
      : "Email is not confirmed. Confirm it in Supabase or disable email confirmation during development.";
  }

  return decoded;
}

export default async function TalentLoginPage({
  params,
  searchParams,
}: PageProps) {
  const { locale: localeParam } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isAr = locale === "ar";
  const errorMessage = getErrorMessage(
    resolvedSearchParams.error,
    isAr
  );

  async function signInWithLocale(formData: FormData) {
    "use server";
    await signInTalentAction(formData, locale);
  }

  async function signUpWithLocale(formData: FormData) {
    "use server";
    await signUpTalentAction(formData, locale);
  }

  return (
    <main
      className="min-h-screen bg-background px-6 py-16 text-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/${locale}`}
          className="text-[10px] uppercase tracking-[0.35em] text-gold transition hover:text-gold-soft"
        >
          {isAr ? "العودة إلى ملامح" : "← Back to MLAMH"}
        </Link>

        <header className="mt-12 mb-10 max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            MLAMH TALENT
          </p>

          <h1
            className="mt-4 text-5xl font-light tracking-tight text-white md:text-7xl"
            style={{
              fontFamily: isAr
                ? "var(--font-noto-arabic)"
                : "var(--font-cormorant)",
            }}
          >
            {isAr ? "دخول الموهبة" : "Talent Access"}
          </h1>

          <p className="mt-5 text-sm leading-7 text-gray-muted">
            {isAr
              ? "سجّل الدخول لإدارة ملفك، حالة التوفر، الصور، وطلبات التواصل."
              : "Sign in to manage your profile, availability, gallery, and requests."}
          </p>
        </header>

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h2 className="text-2xl font-light text-white">
              {isAr ? "تسجيل الدخول" : "Sign in"}
            </h2>

            <form action={signInWithLocale} className="mt-6 space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder={isAr ? "البريد الإلكتروني" : "Email"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <input
                name="password"
                type="password"
                required
                placeholder={isAr ? "كلمة المرور" : "Password"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <button
                type="submit"
                className="w-full rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
              >
                {isAr ? "دخول" : "Sign in"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h2 className="text-2xl font-light text-white">
              {isAr ? "إنشاء حساب موهبة" : "Create talent account"}
            </h2>

            <form action={signUpWithLocale} className="mt-6 space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder={isAr ? "البريد الإلكتروني" : "Email"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder={isAr ? "كلمة المرور" : "Password"}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
              />

              <button
                type="submit"
                className="w-full rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/70 transition hover:border-gold/40 hover:text-gold"
              >
                {isAr ? "إنشاء حساب" : "Create account"}
              </button>
            </form>

            <p className="mt-4 text-xs leading-6 text-gray-muted">
              {isAr
                ? "يمكن إضافة تسجيل الدخول عبر Google و Apple و OTP مستقبلاً بعد استقرار النسخة الأولى من لوحة التحكم."
                : "Google, Apple, and mobile OTP login can be added after the first dashboard version is stable."}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}