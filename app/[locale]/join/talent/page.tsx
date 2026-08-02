import { Footer } from "@/components/Footer";
import { JoinTalentForm } from "@/components/JoinTalentForm";
import { Navbar } from "@/components/Navbar";
import {
  getDictionary,
  isValidLocale,
  type Locale,
} from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function JoinTalentPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/join`);
  }

  const dict = getDictionary(locale);

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="relative z-[2] bg-background"
    >
      <Navbar locale={locale} />

      <div className="relative overflow-hidden pb-20 pt-28 md:pb-28 md:pt-32">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-4xl lg:px-10">
          <header
            className={`mb-10 sm:mb-14 md:mb-16 ${
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
                  ? "استكمال ملف الموهبة"
                  : "Complete Talent Profile"}
              </p>
            </div>

            <h1
              className="text-[clamp(2.5rem,8vw,4.5rem)] font-light leading-[1.05] text-white sm:leading-[0.95]"
              style={{ fontFamily: displayFont }}
            >
              {isRtl
                ? "أكمل ملفك كموهبة"
                : "Complete Your Talent Profile"}
            </h1>

            <p
              className="mt-6 max-w-2xl text-sm leading-7 text-gray-muted md:text-base"
              style={{ fontFamily: bodyFont }}
            >
              {isRtl
                ? "تم إنشاء حسابك. الآن أكمل بيانات الموهبة حتى نجهز ملفك ولوحة التحكم."
                : "Your account has been created. Now complete your talent details so we can prepare your profile and dashboard."}
            </p>
          </header>

          <JoinTalentForm dict={dict} locale={locale} />
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