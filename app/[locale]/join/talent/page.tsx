import { Footer } from "@/components/Footer";
import { TalentQuickSetupForm } from "@/components/TalentQuickSetupForm";
import { Navbar } from "@/components/Navbar";
import {
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type ProfileRow = {
  account_type: string | null;
  display_name: string | null;
  phone: string | null;
  onboarding_status: string | null;
  onboarding_step: string | null;
};

export default async function JoinTalentPage({
  params,
}: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/join?type=talent`);
  }

  /*
   * نتحقق من حالة استكمال الحساب قبل عرض النموذج.
   */
  const {
    data: profile,
    error: profileError,
  } = await authClient
    .from("profiles")
    .select(
      "account_type, display_name, phone, onboarding_status, onboarding_step"
    )
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    console.error(
      "[JoinTalentPage profileLookup]",
      profileError
    );
  }

  /*
   * إذا اكتمل تسجيل الموهبة، لا نعرض نموذج التسجيل مرة أخرى.
   */
  if (
    profile?.account_type === "talent" &&
    profile.onboarding_status === "completed"
  ) {
    redirect(`/${locale}/dashboard/talent`);
  }

  /*
   * منع حساب الناشر من الدخول إلى تسجيل الموهبة
   * بعد اكتمال تحديد نوع حسابه.
   */
  if (
    profile?.account_type === "publisher" &&
    profile.onboarding_status === "completed"
  ) {
    redirect(`/${locale}/dashboard/publisher`);
  }

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <main
  dir={isRtl ? "rtl" : "ltr"}
  className="relative z-[2] bg-background pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0"
>
      <Navbar locale={locale} />

      <div className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="group relative mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-4xl lg:px-10">
          <header
            className={`mb-10 group-has-[.talent-setup-success]:hidden sm:mb-14 md:mb-16 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`mb-6 flex items-center gap-4 ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <span className="gold-line max-w-[80px] flex-1" />

              <p className="arabic-safe text-[10px] uppercase tracking-[0.4em] text-gold">
              {isRtl
  ? "إعداد حساب الموهبة"
  : "Talent Account Setup"}
              </p>
            </div>

            <h1
              className="text-[clamp(2.5rem,8vw,4.5rem)] font-light leading-[1.05] text-white sm:leading-[0.95]"
              style={{ fontFamily: displayFont }}
            >
              {isRtl
  ? "خطوتك الأخيرة"
  : "One Last Step"}
            </h1>

            <p
              className="mt-6 max-w-2xl text-sm leading-7 text-gray-muted md:text-base"
              style={{ fontFamily: bodyFont }}
            >
              {isRtl
  ? "اختر تخصصك الأساسي، وسننقلك مباشرة إلى ملامح."
  : "Choose your primary talent type, and we'll take you straight into MLAMH."}
            </p>
          </header>

          <TalentQuickSetupForm
  locale={locale}
/>
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