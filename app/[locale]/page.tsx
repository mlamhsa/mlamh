import { notFound } from "next/navigation";

import { Agencies } from "@/components/Agencies";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ModelsShowcase } from "@/components/ModelsShowcase";
import { MobileHome } from "@/components/mobile/home/MobileHome";
import { Opportunities } from "@/components/Opportunities";
import { ValueProps } from "@/components/ValueProps";

import { HomepageCMS } from "@/lib/cms/HomepageCMS";
import { ValuePropsCMS } from "@/lib/cms/ValuePropsCMS";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isArabic = locale === "ar";

  const [talentResult, hero, valueProps] = await Promise.all([
    getPublicTalents({
      page: 1,
      pageSize: 12,
    }),
    HomepageCMS.getPublicHero(locale),
    ValuePropsCMS.getPublicValueProps(locale),
  ]);
  
  const talents = talentResult.talents;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative z-[2] min-h-screen bg-background"
    >
      {/* Mobile application home */}
      <div className="lg:hidden">
        <MobileHome
          locale={locale}
          talents={talents}
        />
      </div>

      {/* Existing desktop website */}
      <div className="hidden lg:block">
        <Hero locale={locale} data={hero} />

        <ValueProps locale={locale} data={valueProps} />

        <HowItWorks locale={locale} />

        <ModelsShowcase locale={locale} talents={talents} />

        <Opportunities locale={locale} />

        <Agencies locale={locale} />

        <FinalCTA locale={locale} />

        <Footer locale={locale} />
      </div>
    </main>
  );
}