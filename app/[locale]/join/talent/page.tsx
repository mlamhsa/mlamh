import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TalentQuickSetupForm } from "@/components/TalentQuickSetupForm";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type TalentRole = "actor" | "model";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ message?: string; intent?: string }>;
};

type ProfileRow = {
  account_type: string | null;
  onboarding_status: string | null;
  onboarding_step: string | null;
};

function parseTalentRole(value: unknown): TalentRole | null {
  return value === "actor" || value === "model" ? value : null;
}

export default async function JoinTalentPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const query = searchParams ? await searchParams : {};
  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) redirect(`/${locale}/join`);

  const { data: profile, error: profileError } = await authClient
    .from("profiles")
    .select("account_type, onboarding_status, onboarding_step")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) console.error("[JoinTalentPage profileLookup]", profileError);

  if (profile?.account_type === "publisher") redirect(`/${locale}/workspace`);

  if (profile?.account_type === "talent" && profile.onboarding_status === "completed") {
    redirect(`/${locale}/talent-dashboard`);
  }

  if (
    profile?.account_type === "talent" &&
    profile.onboarding_status === "profile_in_progress" &&
    profile.onboarding_step === "core_data"
  ) {
    redirect(`/${locale}/talent-dashboard/profile`);
  }

  const metadataIntent = parseTalentRole(
    user.user_metadata?.signup_intent ?? user.user_metadata?.talent_intent,
  );
  const queryIntent = parseTalentRole(query.intent);
  const initialRole = metadataIntent ?? queryIntent;
  const emailVerified = query.message === "email_verified";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="relative z-[2] bg-background pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      <Navbar locale={locale} />

      <div className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-4xl lg:px-10">
          {emailVerified ? (
            <div className="mb-8 rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 py-4" role="status">
              <p className="text-sm font-medium text-white">
                {isRtl ? "✓ تم تأكيد بريدك الإلكتروني" : "✓ Your email has been verified"}
              </p>
              <p className="mt-1 text-xs leading-6 text-gray-muted sm:text-sm">
                {isRtl ? "نكمل الآن إعداد ملفك خطوة بخطوة." : "Now we'll continue your profile setup step by step."}
              </p>
            </div>
          ) : null}

          <header className={`mb-10 sm:mb-14 ${isRtl ? "text-right" : "text-left"}`}>
            <p className="arabic-safe text-[10px] uppercase tracking-[0.4em] text-gold">
              {isRtl ? "إعداد ملف الموهبة" : "TALENT PROFILE SETUP"}
            </p>
            <h1 className="mt-4 text-[clamp(2.4rem,8vw,4.2rem)] font-light leading-[1.08] text-white">
              {initialRole
                ? isRtl
                  ? "نبدأ من اختيارك"
                  : "Continue from your choice"
                : isRtl
                  ? "حدد تخصصك الأساسي"
                  : "Choose your primary role"}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-muted md:text-base">
              {initialRole
                ? isRtl
                  ? "حفظنا اختيارك من بداية التسجيل، لذلك لن نكرر عليك نفس السؤال."
                  : "We kept the role you chose at signup, so you won't be asked the same question again."
                : isRtl
                  ? "هذه الخطوة تظهر فقط للحسابات القديمة أو التي لم تحدد المسار أثناء التسجيل."
                  : "This step is only needed for legacy accounts or signups without a saved role."}
            </p>
          </header>

          <TalentQuickSetupForm locale={locale} initialRole={initialRole} />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
          aria-hidden="true"
        />
      </div>

      <Footer locale={locale} />
    </main>
  );
}
