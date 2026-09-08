import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Drama,
  Sparkles,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { GoogleSignupButton } from "@/components/auth/GoogleSignupButton";
import { QuickJoinForm } from "@/components/auth/QuickJoinForm";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  getDictionary,
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountType = "talent" | "publisher";
type SignupIntent = "actor" | "model" | "publisher";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    error?: string;
    type?: string;
    intent?: string;
  }>;
};

function parseIntent(value: string | undefined): SignupIntent | null {
  if (value === "actor" || value === "model" || value === "publisher") {
    return value;
  }
  return null;
}

function parseLegacyType(value: string | undefined): AccountType | null {
  if (value === "talent" || value === "publisher") return value;
  return null;
}

function accountTypeForIntent(intent: SignupIntent | null, legacyType: AccountType | null): AccountType | null {
  if (intent === "publisher") return "publisher";
  if (intent === "actor" || intent === "model") return "talent";
  return legacyType;
}

function onboardingPath(locale: Locale, accountType: AccountType) {
  return accountType === "talent"
    ? `/${locale}/join/talent`
    : `/${locale}/join/publisher`;
}

function intentCopy(intent: SignupIntent | null, accountType: AccountType, isRtl: boolean) {
  if (intent === "actor") {
    return {
      eyebrow: isRtl ? "فرص تمثيل" : "ACTING OPPORTUNITIES",
      body: isRtl
        ? "أنشئ حسابك الأساسي، وبعد تأكيد البريد سنكمل مباشرة مسار الممثل بدون إعادة سؤالك عن تخصصك."
        : "Create your account and, after email verification, continue directly into the actor journey without choosing your role again.",
    };
  }
  if (intent === "model") {
    return {
      eyebrow: isRtl ? "فرص مودل" : "MODELING OPPORTUNITIES",
      body: isRtl
        ? "أنشئ حسابك الأساسي، وبعد تأكيد البريد سنكمل مباشرة مسار المودل بدون إعادة سؤالك عن تخصصك."
        : "Create your account and, after email verification, continue directly into the model journey without choosing your role again.",
    };
  }
  if (accountType === "publisher") {
    return {
      eyebrow: isRtl ? "أبحث عن مواهب" : "FIND TALENT",
      body: isRtl
        ? "أنشئ حسابك الأساسي، ثم أكمل بيانات الناشر واحتياج مشروعك بخطوات واضحة."
        : "Create your account, then complete your publisher details and project needs in a guided flow.",
    };
  }
  return {
    eyebrow: isRtl ? "حساب موهبة" : "TALENT ACCOUNT",
    body: isRtl
      ? "أنشئ حسابك الأساسي، ثم أكمل ملفك المهني وصورك خطوة بخطوة."
      : "Create your account, then complete your professional profile and portfolio step by step.",
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};
  const dictionary = getDictionary(localeParam as Locale);
  return {
    title: `${dictionary.join.metadataTitle} | MLAMH`,
    description: dictionary.join.metadataDescription,
  };
}

export default async function JoinPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const query = searchParams ? await searchParams : {};
  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";
  const intent = parseIntent(query.intent);
  const legacyType = parseLegacyType(query.type);
  const selectedAccountType = accountTypeForIntent(intent, legacyType);

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const storedType = profile?.account_type ?? user.user_metadata?.account_type;
    if (storedType === "admin") redirect("/admin");
    if (storedType === "talent" || storedType === "publisher") {
      redirect(onboardingPath(locale, storedType));
    }

    // Backward-compatible recovery for authenticated legacy accounts that never selected a role.
    redirect(`/${locale}/join/account-type`);
  }

  const selectedCopy = selectedAccountType
    ? intentCopy(intent, selectedAccountType, isRtl)
    : null;

  return (
    <main className="relative z-[2] bg-black pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Navbar locale={locale} />

      <section
        dir={isRtl ? "rtl" : "ltr"}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28 text-white sm:px-6 sm:py-32"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.16),transparent_45%)]" />

        <div className="relative z-10 w-full max-w-5xl">
          {selectedAccountType && selectedCopy ? (
            <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
              <Link
                href={`/${locale}/join`}
                className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/40 hover:text-gold"
              >
                <ArrowLeft size={15} className={isRtl ? "rotate-180" : ""} />
                {isRtl ? "تغيير الهدف" : "Change goal"}
              </Link>

              <div className="mb-7 text-center">
                <div className="mb-6 flex items-center justify-center gap-2">
                  <span className="h-1.5 w-8 rounded-full bg-gold" />
                  <span className="h-1.5 w-8 rounded-full bg-gold" />
                  <span className="h-1.5 w-8 rounded-full bg-white/10" />
                </div>

                <p className="arabic-safe text-xs uppercase tracking-[0.3em] text-gold">
                  {selectedCopy.eyebrow}
                </p>
                <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">
                  {isRtl ? "أنشئ حسابك" : "Create your account"}
                </h1>
                <p className="mt-3 text-sm leading-7 text-white/45">
                  {selectedCopy.body}
                </p>
              </div>

              <QuickJoinForm
                locale={locale}
                accountType={selectedAccountType}
                intent={intent ?? (selectedAccountType === "publisher" ? "publisher" : undefined)}
              />

              <div className="my-5 flex items-center gap-3 text-[11px] text-white/30">
                <span className="h-px flex-1 bg-white/10" />
                <span>{isRtl ? "أو" : "OR"}</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <GoogleSignupButton
                locale={locale}
                accountType={selectedAccountType}
                intent={intent ?? (selectedAccountType === "publisher" ? "publisher" : undefined)}
              />

              <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
                {isRtl ? "لديك حساب؟" : "Already have an account?"}{" "}
                <Link href={`/${locale}/login`} className="text-gold transition hover:text-gold-soft">
                  {isRtl ? "تسجيل الدخول" : "Sign in"}
                </Link>
              </div>
            </div>
          ) : (
            <IntentSelection locale={locale} isRtl={isRtl} />
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function IntentSelection({ locale, isRtl }: { locale: Locale; isRtl: boolean }) {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-7 flex items-center justify-center gap-2">
          <span className="h-1.5 w-8 rounded-full bg-gold" />
          <span className="h-1.5 w-8 rounded-full bg-white/10" />
          <span className="h-1.5 w-8 rounded-full bg-white/10" />
        </div>

        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
          {isRtl ? "ابدأ بما تريد" : "START WITH YOUR GOAL"}
        </p>
        <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
          {isRtl ? "كيف تريد استخدام ملامح؟" : "What do you want to do on MLAMH?"}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
          {isRtl
            ? "اختر هدفك، وسنجهز لك المسار المناسب بدون مصطلحات أو خطوات مكررة."
            : "Choose your goal and we’ll prepare the right journey without duplicate setup steps."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
        <IntentCard
          href={`/${locale}/join?intent=actor`}
          icon={<Drama size={24} />}
          title={isRtl ? "أريد فرص تمثيل" : "I want acting opportunities"}
          description={isRtl ? "أنشئ ملف ممثل وابدأ التقديم على الفرص المناسبة." : "Create an actor profile and apply to relevant opportunities."}
          actionLabel={isRtl ? "ابدأ كممثل" : "Continue as actor"}
        />
        <IntentCard
          href={`/${locale}/join?intent=model`}
          icon={<Sparkles size={24} />}
          title={isRtl ? "أريد فرص مودل" : "I want modeling opportunities"}
          description={isRtl ? "أنشئ ملف مودل واعرض صورك وبياناتك المهنية." : "Create a model profile and showcase your portfolio."}
          actionLabel={isRtl ? "ابدأ كمودل" : "Continue as model"}
        />
        <IntentCard
          href={`/${locale}/join?intent=publisher`}
          icon={<BriefcaseBusiness size={24} />}
          title={isRtl ? "أبحث عن مواهب لمشروع" : "I need talent for a project"}
          description={isRtl ? "أنشئ حساب ناشر وأكمل احتياج مشروعك بخطوات واضحة." : "Create a publisher account and define your project needs."}
          actionLabel={isRtl ? "ابدأ البحث عن مواهب" : "Continue to find talent"}
        />
      </div>

      <div className="mt-10 text-center text-sm text-white/40">
        {isRtl ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
        <Link href={`/${locale}/login`} className="text-gold transition hover:text-gold-soft">
          {isRtl ? "تسجيل الدخول" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}

function IntentCard({
  href,
  icon,
  title,
  description,
  actionLabel,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[285px] flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/45 hover:bg-gold/[0.045] sm:p-7"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold transition group-hover:bg-gold group-hover:text-black">
        {icon}
      </div>
      <h2 className="mt-7 text-2xl font-light leading-tight sm:text-3xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-white/45">{description}</p>
      <div className="mt-auto flex items-center justify-between gap-4 pt-8 text-sm text-gold">
        <span>{actionLabel}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 transition group-hover:bg-gold group-hover:text-black">
          <ArrowLeft size={17} className="rotate-180 rtl:rotate-0" />
        </span>
      </div>
    </Link>
  );
}
