import { Agencies } from "@/components/Agencies";
import { Categories } from "@/components/Categories";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ModelsShowcase } from "@/components/ModelsShowcase";
import { Navbar } from "@/components/Navbar";
import { Statistics } from "@/components/Statistics";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

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
  const dict = getDictionary(locale);

  return (
    <main className="relative z-[2] bg-background">
      <Navbar dict={dict} locale={locale} />

      <Hero dict={dict} locale={locale} />

      <HowItWorks
        dict={dict}
        locale={locale}
      />

      <Categories
        dict={dict}
        locale={locale}
      />

      <ModelsShowcase
        dict={dict}
        locale={locale}
      />

      <Statistics
        dict={dict}
        locale={locale}
      />

      <Agencies
        dict={dict}
        locale={locale}
      />

      <Footer
        dict={dict}
        locale={locale}
      />
    </main>
  );
}