import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { QuickJoinForm } from "@/components/auth/QuickJoinForm";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  getDictionary,
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type JoinError =
  | "missing"
  | "password_short"
  | "password_mismatch"
  | "terms"
  | "email_exists"
  | "rate_limit"
  | "signup";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string }>;
};

function getJoinErrorMessage(
  error: string | undefined,
  isRtl: boolean
) {
  if (error === "missing") {
    return isRtl
      ? "أكمل جميع الحقول المطلوبة."
      : "Please complete all required fields.";
  }

  if (error === "password_short") {
    return isRtl
      ? "يجب أن تتكون كلمة المرور من ٨ أحرف على الأقل."
      : "Your password must contain at least 8 characters.";
  }

  if (error === "password_mismatch") {
    return isRtl
      ? "كلمتا المرور غير متطابقتين."
      : "The passwords do not match.";
  }

  if (error === "terms") {
    return isRtl
      ? "يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة."
      : "You must accept the Terms and Privacy Policy to continue.";
  }

  if (error === "email_exists") {
    return isRtl
      ? "يوجد حساب مرتبط بهذا البريد الإلكتروني. جرّب تسجيل الدخول."
      : "An account already exists with this email. Try signing in.";
  }

  if (error === "rate_limit") {
    return isRtl
      ? "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى."
      : "Too many attempts. Please wait a moment and try again.";
  }

  if (error === "signup") {
    return isRtl
      ? "تعذر إنشاء الحساب حاليًا. تحقق من البيانات وحاول مرة أخرى."
      : "Could not create your account. Check your details and try again.";
  }

  return null;
}

function getSignupErrorCode(
  message: string | undefined
): JoinError {
  const normalizedMessage = String(message ?? "").toLowerCase();

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("user already")
  ) {
    return "email_exists";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests") ||
    normalizedMessage.includes("email rate")
  ) {
    return "rate_limit";
  }

  return "signup";
}

async function quickJoinAction(formData: FormData) {
  "use server";

  const rawLocale = String(formData.get("locale") ?? "ar");
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "ar";

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(
    formData.get("passwordConfirmation") ?? ""
  );

  const acceptTerms =
    String(formData.get("acceptTerms") ?? "") === "accepted";

  if (!email || !password || !passwordConfirmation) {
    redirect(`/${locale}/join?error=missing`);
  }

  if (password.length < 8) {
    redirect(`/${locale}/join?error=password_short`);
  }

  if (password !== passwordConfirmation) {
    redirect(`/${locale}/join?error=password_mismatch`);
  }

  if (!acceptTerms) {
    redirect(`/${locale}/join?error=terms`);
  }

  const authClient = await createServerSupabaseClient();

  const { data, error } = await authClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    const errorCode = getSignupErrorCode(error.message);

    redirect(`/${locale}/join?error=${errorCode}`);
  }

  if (!data.user) {
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

export default async function JoinPage({
  params,
  searchParams,
}: PageProps) {
  const { locale: localeParam } = await params;
  const resolvedSearchParams = searchParams
    ? await searchParams
    : {};

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

  const errorMessage = getJoinErrorMessage(
    resolvedSearchParams.error,
    isRtl
  );

  return (
    <main className="relative z-[2] bg-black">
      <Navbar locale={locale} />

      <section
        dir={isRtl ? "rtl" : "ltr"}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28 text-white sm:px-6 sm:py-32"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

        <div className="relative w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
          <div className="mb-7 text-center sm:mb-8">
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="h-1.5 w-8 rounded-full bg-gold" />
              <span className="h-1.5 w-8 rounded-full bg-white/10" />
              <span className="h-1.5 w-8 rounded-full bg-white/10" />
            </div>

            <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
              {isRtl ? "انضم إلى ملامح" : "Join MLAMH"}
            </p>

            <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">
              {isRtl
                ? "ابدأ بإنشاء حسابك"
                : "Start with your account"}
            </h1>

            <p className="mt-3 text-sm leading-7 text-white/45">
              {isRtl
                ? "أنشئ حسابك، ثم اختر هل تريد الانضمام كموهبة أو كجهة ناشرة."
                : "Create your account, then choose whether to join as talent or as a publisher."}
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm leading-6 text-red-300"
            >
              {errorMessage}
            </div>
          ) : null}

          <QuickJoinForm
            locale={locale}
            action={quickJoinAction}
          />

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