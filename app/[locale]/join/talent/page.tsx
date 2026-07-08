import { Footer } from "@/components/Footer";
import { JoinTalentForm } from "@/components/JoinTalentForm";
import { Navbar } from "@/components/Navbar";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
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
  const j = dict.join;

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <main className="relative z-[2] bg-background">
      <Navbar locale={locale} />

      <div className="relative overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 lg:max-w-4xl lg:px-10">
          <header
            className={`mb-14 md:mb-16 ${isRtl ? "text-right" : "text-left"}`}
          >
            <div
              className={`mb-6 flex items-center gap-4 ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <span className="gold-line max-w-[80px] flex-1" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
                {isRtl ? "استكمال ملف الموهبة" : "Complete Talent Profile"}
              </p>
            </div>

            <h1
              className="text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.95] font-light text-white"
              style={{ fontFamily: displayFont }}
            >
              {isRtl ? "أكمل ملفك كموهبة" : "Complete Your Talent Profile"}
            </h1>

            <p
              className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-muted md:text-base"
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
          aria-hidden
        />
      </div>

      <Footer locale={locale} />
    </main>
  );
}