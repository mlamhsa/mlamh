import { notFound } from "next/navigation";

import { Agencies } from "@/components/Agencies";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ModelsShowcase } from "@/components/ModelsShowcase";
import { Navbar } from "@/components/Navbar";
import { Opportunities } from "@/components/Opportunities";
import { ValueProps } from "@/components/ValueProps";

import { HomepageCMS } from "@/lib/cms/HomepageCMS";
import { ValuePropsCMS } from "@/lib/cms/ValuePropsCMS";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getTalents } from "@/lib/supabase/talents";

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

  const [talents, hero, valueProps] = await Promise.all([
    getTalents(),
    HomepageCMS.getPublicHero(locale),
    ValuePropsCMS.getPublicValueProps(locale),
  ]);

  return (
    <main className="relative z-[2] bg-background">
      <Navbar locale={locale} />

      <Hero
        locale={locale}
        data={hero}
      />

      <ValueProps
        locale={locale}
        data={valueProps}
      />

      <HowItWorks locale={locale} />

      <ModelsShowcase
        locale={locale}
        talents={talents}
      />

      <Opportunities locale={locale} />
      <Agencies locale={locale} />
      <FinalCTA locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}