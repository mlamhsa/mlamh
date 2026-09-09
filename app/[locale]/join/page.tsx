import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BriefcaseBusiness, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { AppleSignupButton } from "@/components/auth/AppleSignupButton";
import { GoogleSignupButton } from "@/components/auth/GoogleSignupButton";
import { QuickJoinForm } from "@/components/auth/QuickJoinForm";
import { TalentEmailSignupForm } from "@/components/auth/TalentEmailSignupForm";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountType = "talent" | "publisher";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string; type?: string; intent?: string }>;
};

function parseAccountType(type?: string, intent?: string): AccountType | null {
  if (type === "talent" || type === "publisher") return type;
  if (intent === "publisher") return "publisher";
  if (intent === "actor" || intent === "model") return "talent";
  return null;
}

function destinationForExistingAccount(locale: Locale, accountType: AccountType) {
  return accountType === "talent"
    ? `/${locale}/dashboard-router`
    : `/${locale}/join/publisher`;
}

function accountCopy(accountType: AccountType, isRtl: boolean) {
  if (accountType === "publisher") {
    return {
      eyebrow: isRtl ? "الخطوة الثانية" : "STEP TWO",
      title: isRtl ? "إنشاء حساب الباحث عن مواهب" : "Create your hiring account",
      body: isRtl
        ? "أنشئ حسابك أولًا، ثم نكمل إعداد حساب الناشر خطوة بخطوة."
        : "Create your account first, then we’ll complete your publisher setup step by step.",
    };
  }

  return {
    eyebrow: isRtl ? "الخطوة الثانية" : "STEP TWO",
    title: isRtl ? "إنشاء حساب الموهبة" : "Create your talent account",
    body: isRtl
      ? "إذا اخترت البريد الإلكتروني ستدخل بياناتك الأساسية هنا. وإذا اخترت Google أو Apple سنستخدم البيانات المتوفرة ونطلب منك فقط المعلومات الضرورية الناقصة."
      : "With email, enter your essential information here. With Google or Apple, we’ll use the information already available and ask only for required missing details.",
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
  const selectedAccountType = parseAccountType(query.type, query.intent);

  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("account_type, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const storedType = profile?.account_type ?? user.user_metadata?.account_type;
    if (storedType === "admin") redirect("/admin");
    if (storedType === "talent" || storedType === "publisher") {
      redirect(destinationForExistingAccount(locale, storedType));
    }
  }

  const selectedCopy = selectedAccountType ? accountCopy(selectedAccountType, isRtl) : null;

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
            <div className={`mx-auto w-full rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-7 ${selectedAccountType === "talent" ? "max-w-3xl" : "max-w-md"}`}>
              <Link href={`/${locale}/join`} className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/40 hover:text-gold">
                <ArrowLeft size={15} className={isRtl ? "rotate-180" : ""} />
                {isRtl ? "رجوع" : "Back"}
              </Link>

              <div className="mb-7 text-center">
                <div className="mb-6 flex items-center justify-center gap-2">
                  <span className="h-1.5 w-8 rounded-full bg-gold" />
                  <span className="h-1.5 w-8 rounded-full bg-gold" />
                  <span className="h-1.5 w-8 rounded-full bg-white/10" />
                </div>
                <p className="arabic-safe text-xs uppercase tracking-[0.3em] text-gold">{selectedCopy.eyebrow}</p>
                <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">{selectedCopy.title}</h1>
                <p className="mt-3 text-sm leading-7 text-white/45">{selectedCopy.body}</p>
              </div>

              <GoogleSignupButton
                locale={locale}
                accountType={selectedAccountType}
                intent={selectedAccountType === "publisher" ? "publisher" : undefined}
              />
              <AppleSignupButton
                locale={locale}
                accountType={selectedAccountType}
              />

              {selectedAccountType === "talent" ? (
                <p className="mt-3 text-center text-xs leading-6 text-white/40">
                  {isRtl
                    ? "بعد Google أو Apple ستظهر لك فقط الحقول الضرورية التي لم نحصل عليها من حسابك."
                    : "After Google or Apple, you’ll only see required fields we could not obtain from your account."}
                </p>
              ) : null}

              <div className="my-6 flex items-center gap-3 text-[11px] text-white/30">
                <span className="h-px flex-1 bg-white/10" />
                <span>{isRtl ? "أو التسجيل بالبريد الإلكتروني" : "OR CONTINUE WITH EMAIL"}</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              {selectedAccountType === "talent" ? (
                <TalentEmailSignupForm locale={locale} />
              ) : (
                <QuickJoinForm locale={locale} accountType="publisher" intent="publisher" />
              )}

              <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/45">
                {isRtl ? "لديك حساب؟" : "Already have an account?"}{" "}
                <Link href={`/${locale}/login`} className="text-gold transition hover:text-gold-soft">{isRtl ? "تسجيل الدخول" : "Sign in"}</Link>
              </div>
            </div>
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
        <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">{isRtl ? "الخطوة الأولى" : "STEP ONE"}</p>
        <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">{isRtl ? "كيف تريد استخدام ملامح؟" : "How will you use MLAMH?"}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
          {isRtl ? "اختر مسارك الآن. بعد إنشاء الحساب ستدخل مباشرة إلى لوحة التحكم الخاصة بك." : "Choose your path now. After signup, you’ll go directly to your dashboard."}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        <ChoiceCard
          href={`/${locale}/join?type=talent`}
          icon={<UserRound size={27} />}
          eyebrow={isRtl ? "للمواهب" : "FOR TALENT"}
          title={isRtl ? "أنا موهبة" : "I’m talent"}
          description={isRtl ? "أنشئ حسابك، أكمل ملفك المهني من لوحة التحكم، ثم تقدم للفرص المناسبة لك." : "Create your account, complete your professional profile in the dashboard, then apply to relevant opportunities."}
          actionLabel={isRtl ? "ابدأ كموهبة" : "Start as talent"}
          featured
        />
        <ChoiceCard
          href={`/${locale}/join?type=publisher`}
          icon={<BriefcaseBusiness size={27} />}
          eyebrow={isRtl ? "للشركات والوكالات وأصحاب المشاريع" : "FOR COMPANIES, AGENCIES & PROJECTS"}
          title={isRtl ? "أبحث عن مواهب" : "I’m looking for talent"}
          description={isRtl ? "أنشئ حسابك لنشر الفرص واستقبال طلبات المواهب واختيار المناسب." : "Create your account to publish opportunities, receive applications and select talent."}
          actionLabel={isRtl ? "ابدأ البحث عن مواهب" : "Start finding talent"}
        />
      </div>

      <div className="mt-10 text-center text-sm text-white/40">
        {isRtl ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
        <Link href={`/${locale}/login`} className="text-gold transition hover:text-gold-soft">{isRtl ? "تسجيل الدخول" : "Sign in"}</Link>
      </div>
    </div>
  );
}

function ChoiceCard({ href, icon, eyebrow, title, description, actionLabel, featured = false }: {
  href: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  featured?: boolean;
}) {
  return (
    <Link href={href} className={`group flex min-h-[20rem] flex-col rounded-[2rem] border p-7 transition sm:p-9 ${featured ? "border-gold/45 bg-gold/[0.045] hover:border-gold/75" : "border-white/10 bg-white/[0.025] hover:border-gold/40"}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.07] text-gold">{icon}</div>
      <p className="mt-8 text-xs font-medium text-gold">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-light leading-tight text-white">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-white/45">{description}</p>
      <div className="mt-auto flex items-center justify-between gap-4 pt-8 text-sm font-medium text-gold">
        <span>{actionLabel}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 transition group-hover:border-gold group-hover:bg-gold group-hover:text-black"><ArrowLeft size={17} className="rotate-180" /></span>
      </div>
    </Link>
  );
}
