import { Agencies } from "@/components/Agencies";
import { Categories } from "@/components/Categories";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ModelsShowcase } from "@/components/ModelsShowcase";
import { Navbar } from "@/components/Navbar";
import { Statistics } from "@/components/Statistics";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { ValueProps } from "@/components/ValueProps";
import { Opportunities } from "@/components/Opportunities";
import { FinalCTA } from "@/components/FinalCTA";

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

  const talents = await getTalents();

  return (
    <main className="relative z-[2] bg-background">

      <Navbar locale={locale} />
      <Hero locale={locale} />
      <ValueProps locale={locale} />
      <HowItWorks locale={locale} />

      <ModelsShowcase locale={locale} talents={talents} />
      <Opportunities locale={locale} />
      <Agencies locale={locale} />
      <FinalCTA locale={locale} />

      <Footer locale={locale} />

    </main>
  );
}