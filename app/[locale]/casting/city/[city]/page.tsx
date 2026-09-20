import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSaudiCityBySlug } from "@/lib/data/saudi-cities";
import { isValidLocale, type Locale } from "@/lib/i18n";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

const CASTING_CITY_SLUGS = new Set(["riyadh", "jeddah"]);

type PageProps = {
  params: Promise<{ locale: string; city: string }>;
};

function getCopy(cityName: string, locale: Locale) {
  if (locale === "ar") {
    return {
      title: `كاستنج ${cityName} | اختيار ممثلين ومودلز للمشاريع | ملامح`,
      description: `خدمة كاستنج للمشاريع في ${cityName}: تنظيم الـBrief، البحث عن ممثلين ومودلز، الفرز، إعداد Shortlist، ثم تأكيد المواهب والحجز عبر ملامح.`,
      h1: `كاستنج في ${cityName} للممثلين والمودلز`,
      intro: `إذا كان مشروعك يحتاج ممثلين أو مودلز في ${cityName}، تساعدك ملامح من تحويل احتياجك إلى Brief واضح وحتى الوصول إلى Shortlist ومواهب مؤكدة للتنفيذ.`,
      points: [
        "تنظيم متطلبات المشروع والأدوار المطلوبة قبل بدء البحث.",
        `البحث والمطابقة مع المواهب المناسبة للعمل في ${cityName}.`,
        "فرز الطلبات والدعوات وتجهيز Shortlist واضحة للمراجعة.",
        "تأكيد التوفر والتنسيق مع المواهب بعد اعتماد اختيارك.",
      ],
      cta: "أرسل Brief الكاستنج",
      talentCta: `استعرض المواهب العامة في ${cityName}`,
    };
  }

  return {
    title: `Casting in ${cityName} | Actors & Models for Projects | MLAMH`,
    description: `Managed casting in ${cityName}: brief structuring, actor and model sourcing, screening, shortlist delivery, talent confirmation and booking through MLAMH.`,
    h1: `Casting in ${cityName} for actors and models`,
    intro: `If your project needs actors or models in ${cityName}, MLAMH can structure the brief, source suitable talent, organize screening, and deliver a review-ready shortlist before confirmation.`,
    points: [
      "Structure the project brief and role requirements before sourcing begins.",
      `Source and match talent suitable for work in ${cityName}.`,
      "Organize applications and invitations into a clear shortlist.",
      "Coordinate availability and confirmation after your selection.",
    ],
    cta: "Send a casting brief",
    talentCta: `Browse public talent in ${cityName}`,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, city } = await params;
  if (!isValidLocale(rawLocale) || !CASTING_CITY_SLUGS.has(city)) {
    return { robots: { index: false, follow: false } };
  }

  const locale = rawLocale as Locale;
  const cityItem = getSaudiCityBySlug(city);
  if (!cityItem) return { robots: { index: false, follow: false } };

  const cityName = locale === "ar" ? cityItem.ar : cityItem.en;
  const copy = getCopy(cityName, locale);
  const canonical = `${SITE_URL}/${locale}/casting/city/${city}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/casting/city/${city}`,
        en: `${SITE_URL}/en/casting/city/${city}`,
        "x-default": `${SITE_URL}/ar/casting/city/${city}`,
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: "MLAMH",
      type: "website",
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CastingCityPage({ params }: PageProps) {
  const { locale: rawLocale, city } = await params;
  if (!isValidLocale(rawLocale) || !CASTING_CITY_SLUGS.has(city)) notFound();

  const locale = rawLocale as Locale;
  const cityItem = getSaudiCityBySlug(city);
  if (!cityItem) notFound();

  const isArabic = locale === "ar";
  const cityName = isArabic ? cityItem.ar : cityItem.en;
  const copy = getCopy(cityName, locale);
  const canonical = `${SITE_URL}/${locale}/casting/city/${city}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isArabic ? "ملامح" : "MLAMH",
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isArabic ? "إدارة الكاستينغ" : "Managed Casting",
        item: `${SITE_URL}/${locale}/casting`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isArabic ? `كاستنج ${cityName}` : `Casting in ${cityName}`,
        item: canonical,
      },
    ],
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonical}#service`,
    name: isArabic ? `خدمة كاستنج في ${cityName} من ملامح` : `MLAMH Casting Service in ${cityName}`,
    description: copy.description,
    provider: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "MLAMH",
      alternateName: "ملامح",
      url: SITE_URL,
    },
    areaServed: {
      "@type": "City",
      name: cityItem.en,
      containedInPlace: { "@type": "Country", name: "Saudi Arabia" },
    },
    url: canonical,
  };

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-black px-5 pb-24 pt-28 text-white sm:px-8 lg:px-10 lg:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-10 lg:p-14">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">MLAMH CASTING</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">{copy.h1}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-white/55 sm:text-base">{copy.intro}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={`/${locale}/casting#casting-brief`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110">
              {copy.cta}
            </Link>
            <Link href={`/${locale}/talent/city/${city}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gold/30 px-6 py-3 text-sm text-gold transition hover:bg-gold/10">
              {copy.talentCta}
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {copy.points.map((point, index) => (
            <article key={point} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6">
              <span className="text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-3 text-sm leading-7 text-white/60">{point}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
          <h2 className="text-2xl font-light">
            {isArabic ? `تحتاج كاستنج لمشروع في ${cityName}؟` : `Need casting for a project in ${cityName}?`}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
            {isArabic
              ? "أرسل ما تعرفه عن المشروع الآن. لا تحتاج إلى تجهيز إعلان كامل قبل التواصل، وسنراجع الاحتياج ونحدد الخطوة التالية."
              : "Send what you know about the project now. You do not need a finished casting notice before getting started; we will review the need and define the next step."}
          </p>
          <Link href={`/${locale}/casting#casting-brief`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/30 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10">
            {copy.cta}
          </Link>
        </section>
      </div>
    </main>
  );
}
