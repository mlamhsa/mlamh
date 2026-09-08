import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Drama,
  Sparkles,
  UserRound,
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
type Audience = "talent" | "organization";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    error?: string;
    type?: string;
    intent?: string;
    audience?: string;
  }>;
};

function parseIntent(value: string | undefined): SignupIntent | null {
  if (value === "actor" || value === "model" || value === "publisher") {
    return value;
  }
  return null;
}

function parseAudience(value: string | undefined): Audience | null {
  if (value === "talent" || value === "organization") return value;
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
        ? "أنشئ حسابك، وبعد تأكيد البريد سنكمل مباشرة إعداد ملف الممثل."
        : "Create your account and, after email verification, continue directly into your actor profile setup.",
    };
  }
  if (intent === "model") {
    return {
      eyebrow: isRtl ? "فرص مودل" : "MODELING OPPORTUNITIES",
      body: isRtl
        ? "أنشئ حسابك، وبعد تأكيد البريد سنكمل مباشرة إعداد ملف المودل."
        : "Create your account and, after email verification, continue directly into your model profile setup.",
    };
  }
  if (accountType === "publisher") {
    return {
      eyebrow: isRtl ? "للشركات والجهات" : "FOR ORGANIZATIONS",
      body: isRtl
        ? "أنشئ حسابك، ثم أخبرنا عن مشروعك أو احتياجك للمواهب بخطوات واضحة."
        : "Create your account, then tell us about your project or talent needs in a guided flow.",
    };
  }
  return {
    eyebrow: isRtl ? "حساب موهبة" : "TALENT ACCOUNT",
    body: isRtl
      ? "أنشئ حسابك، ثم أكمل ملفك المهني وصورك خطوة بخطوة."
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
  const audience = parseAudience(query.audience);
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
                href={`/${locale}/join${selectedAccountType === "talent" ? "?audience=talent" : ""}`}
                className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/40 hover:text-gold"
              >
                <ArrowLeft size={15} className={isRtl ? "rotate-180" : ""} />
                {isRtl ? "رجوع" : "Back"}
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
          ) : audience === "talent" ? (
            <TalentIntentSelection locale={locale} isRtl={isRtl} />
          ) : (
            <AudienceSelection locale={locale} isRtl={isRtl} />
          )}
        </div>
      </section>

      <Footer locale={locale} />
    </main>
  );
}

function AudienceSelection({ locale, isRtl }: { locale: Locale; isRtl: boolean }) {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
          {isRtl ? "ابدأ من هنا" : "START HERE"}
        </p>
        <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
          {isRtl ? "ما الذي تريد القيام به؟" : "What would you like to do?"}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
          {isRtl
            ? "اختر الخيار الأقرب لك. سنأخذك مباشرة إلى التسجيل المناسب بدون مصطلحات معقدة."
            : "Choose the option that best describes you. We’ll take you directly to the right signup flow."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <ChoiceCard
          href={`/${locale}/join?audience=talent`}
          icon={<UserRound size={27} />}
          eyebrow={isRtl ? "للممثلين والمودلز" : "FOR ACTORS & MODELS"}
          title={isRtl ? "أنا موهبة وأبحث عن فرص" : "I’m talent looking for opportunities"}
          description={isRtl ? "إذا كنت تريد التقديم على فرص تمثيل أو مودل، ابدأ من هنا." : "Start here if you want to apply to acting or modeling opportunities."}
          actionLabel={isRtl ? "ابدأ كموهبة" : "Continue as talent"}
          featured
        />
        <ChoiceCard
          href={`/${locale}/join?intent=publisher`}
          icon={<BriefcaseBusiness size={27} />}
          eyebrow={isRtl ? "للشركات والجهات وأصحاب المشاريع" : "FOR ORGANIZATIONS & PROJECTS"}
          title={isRtl ? "لدي مشروع وأبحث عن مواهب" : "I have a project and need talent"}
          description={isRtl ? "إذا كنت تريد ممثلين أو مودلز لمشروع أو إعلان أو تصوير أو فعالية، ابدأ من هنا." : "Start here if you need actors or models for a project, campaign, shoot, or event."}
          actionLabel={isRtl ? "ابدأ كجهة" : "Continue as an organization"}
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

function TalentIntentSelection({ locale, isRtl }: { locale: Locale; isRtl: boolean }) {
  return (
    <div>
      <div className="mx-auto max-w-3xl text-center">
        <Link
          href={`/${locale}/join`}
          className="mb-7 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/40 hover:text-gold"
        >
          <ArrowLeft size={15} className={isRtl ? "rotate-180" : ""} />
          {isRtl ? "رجوع" : "Back"}
        </Link>
        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
          {isRtl ? "اختر نوع الفرص" : "CHOOSE YOUR OPPORTUNITIES"}
        </p>
        <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl">
          {isRtl ? "ما نوع الفرص التي تبحث عنها؟" : "What opportunities are you looking for?"}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
          {isRtl ? "اختر الأقرب لك الآن، ويمكنك تطوير ملفك لاحقًا." : "Choose what fits you best right now. You can expand your profile later."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <ChoiceCard
          href={`/${locale}/join?intent=actor`}
          icon={<Drama size={27} />}
          eyebrow={isRtl ? "تمثيل" : "ACTING"}
          title={isRtl ? "أبحث عن فرص تمثيل" : "I’m looking for acting opportunities"}
          description={isRtl ? "أنشئ ملف ممثل وقدّم على الأدوار وفرص التمثيل المناسبة لك." : "Create an actor profile and apply to suitable roles and acting opportunities."}
          actionLabel={isRtl ? "ابدأ كممثل" : "Continue as actor"}
          featured
        />
        <ChoiceCard
          href={`/${locale}/join?intent=model`}
          icon={<Sparkles size={27} />}
          eyebrow={isRtl ? "مودل وتصوير" : "MODELING & SHOOTS"}
          title={isRtl ? "أبحث عن فرص مودل وتصوير" : "I’m looking for modeling opportunities"}
          description={isRtl ? "أنشئ ملف مودل واعرض صورك وبياناتك للتقديم على فرص التصوير والمودل." : "Create a model profile and showcase your portfolio for modeling and photo opportunities."}
          actionLabel={isRtl ? "ابدأ كمودل" : "Continue as model"}
        />
      </div>
    </div>
  );
}

function ChoiceCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  actionLabel,
  featured = false,
}: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-[300px] flex-col rounded-[1.75rem] border p-6 transition duration-300 hover:-translate-y-1 sm:p-8 ${featured ? "border-gold/30 bg-gold/[0.045] hover:border-gold/60" : "border-white/10 bg-white/[0.025] hover:border-gold/45 hover:bg-gold/[0.04]"}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold transition group-hover:bg-gold group-hover:text-black">
        {icon}
      </div>
      <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.2em] text-gold/70">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-light leading-tight sm:text-3xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-white/50">{description}</p>
      <div className="mt-auto flex items-center justify-between gap-4 pt-8 text-sm font-medium text-gold">
        <span>{actionLabel}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 transition group-hover:bg-gold group-hover:text-black">
          <ArrowLeft size={17} className="rotate-180 rtl:rotate-0" />
        </span>
      </div>
    </Link>
  );
}
