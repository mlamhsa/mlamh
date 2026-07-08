import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string }>;
};

async function quickJoinAction(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/${locale}/join?error=missing`);
  }

  const authClient = await createServerSupabaseClient();

  const { error } = await authClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/${locale}/join?error=signup`);
  }

  redirect(`/${locale}/join/account-type`);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam as Locale);

  return {
    title: `${dict.join.metadataTitle} | MLAMH`,
    description: dict.join.metadataDescription,
  };
}

export default async function JoinPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (user) {
    redirect(`/${locale}/join/account-type`);
  }

  const hasError = Boolean(resolvedSearchParams.error);

  return (
    <main className="relative z-[2] bg-black">
      <Navbar locale={locale} />

      <section
        dir={isRtl ? "rtl" : "ltr"}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-32 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "انضم إلى ملامح" : "Join MLAMH"}
            </p>

            <h1 className="mt-4 text-4xl font-light">
              {isRtl ? "ابدأ بحسابك أولاً" : "Start with your account"}
            </h1>

            <p className="mt-3 text-sm leading-7 text-white/45">
              {isRtl
                ? "أنشئ حسابك خلال ثوانٍ، ثم اختر هل أنت موهبة أو ناشر."
                : "Create your account in seconds, then choose whether you are talent or publisher."}
            </p>
          </div>

          {hasError ? (
            <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
              {isRtl
                ? "تعذر إنشاء الحساب. تأكد من البيانات وحاول مرة أخرى."
                : "Could not create account. Please check your details and try again."}
            </div>
          ) : null}

          <form action={quickJoinAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />

            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={isRtl ? "البريد الإلكتروني" : "Email"}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50"
            />

            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder={isRtl ? "كلمة المرور" : "Password"}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none placeholder:text-white/25 focus:border-gold/50"
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-gold py-4 text-sm font-medium text-black transition hover:bg-[#e0bd73]"
            >
              {isRtl ? "ابدأ الآن" : "Get Started"}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
            {isRtl ? "لديك حساب؟" : "Already have an account?"}{" "}
            <Link
              href={`/${locale}/login`}
              className="text-gold transition hover:text-gold-soft"
            >
              {isRtl ? "تسجيل الدخول" : "Sign in"}
            </Link>
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}