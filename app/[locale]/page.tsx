import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Agencies } from "@/components/Agencies";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { CastingBriefCTA } from "@/components/home/CastingBriefCTA";
import { HomeScrollReset } from "@/components/home/HomeScrollReset";
import { ModelsShowcase } from "@/components/ModelsShowcase";
import { MobileHome } from "@/components/mobile/home/MobileHome";
import { Opportunities } from "@/components/Opportunities";
import { ValueProps } from "@/components/ValueProps";

import { HomepageCMS } from "@/lib/cms/HomepageCMS";
import { ValuePropsCMS } from "@/lib/cms/ValuePropsCMS";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getPublicTalents } from "@/lib/supabase/public-talents";
import { getHomepageTalentsWithFeaturedEntitlements } from "@/lib/talent/public-featured-entitlements";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) return {};

  const locale = localeParam as Locale;
  const isArabic = locale === "ar";
  const title = isArabic
    ? "ملامح | منصة المواهب وفرص الكاستينغ في السعودية"
    : "MLAMH | Talent Platform & Casting Opportunities in Saudi Arabia";
  const description = isArabic
    ? "اكتشف ممثلين ومودلز وفرص تمثيل وكاستينغ في السعودية عبر ملامح، المنصة التي تربط المواهب بالشركات والوكالات وجهات الإنتاج."
    : "Discover actors, models, casting calls and creative opportunities in Saudi Arabia on MLAMH, connecting talent with companies, agencies and production teams.";
  const canonical = `${SITE_URL}/${locale}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/ar`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "MLAMH | ملامح",
      type: "website",
      locale: isArabic ? "ar_SA" : "en_US",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: isArabic ? "ملامح - منصة المواهب وفرص الكاستينغ" : "MLAMH - Talent Platform & Casting Opportunities",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function HomePage({ params }: HomePageProps) {
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

  const talents = await getHomepageTalentsWithFeaturedEntitlements(talentResult.talents);

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative z-[2] min-h-screen bg-background"
    >
      <HomeScrollReset />

      <div className="lg:hidden">
        <MobileHome
          locale={locale}
          talents={talents}
          valueProps={valueProps}
        />
      </div>

      <div className="hidden lg:block">
        <Hero locale={locale} data={hero} />

        <CastingBriefCTA locale={locale} />

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
