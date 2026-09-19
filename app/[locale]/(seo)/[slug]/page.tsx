import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoAcquisitionLanding } from "@/components/public/SeoAcquisitionLanding";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";
import {
  SEO_ACQUISITION_LANDINGS,
  getSeoAcquisitionLanding,
} from "@/lib/seo/acquisition-landings";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    SEO_ACQUISITION_LANDINGS.map((landing) => ({
      locale,
      slug: landing.slug,
    })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) return {};

  const landing = getSeoAcquisitionLanding(slug);
  if (!landing) return {};

  const locale = rawLocale as Locale;
  const copy = landing[locale];
  const canonical = `${SITE_URL}/${locale}/${slug}`;

  return {
    title: copy.title,
    description: copy.description,
    keywords: landing.keywords,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/${slug}`,
        en: `${SITE_URL}/en/${slug}`,
        "x-default": `${SITE_URL}/ar/${slug}`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName: locale === "ar" ? "ملامح" : "MLAMH",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: copy.title,
        },
      ],
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

export default async function SeoAcquisitionPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isValidLocale(rawLocale)) notFound();

  const landing = getSeoAcquisitionLanding(slug);
  if (!landing) notFound();

  const locale = rawLocale as Locale;
  const copy = landing[locale];
  const pageUrl = `${SITE_URL}/${locale}/${slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "ar" ? "ملامح" : "MLAMH",
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: copy.eyebrow,
        item: pageUrl,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: copy.title,
    description: copy.description,
    inLanguage: locale === "ar" ? "ar-SA" : "en",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "MLAMH",
    },
    about: landing.keywords.map((keyword) => ({
      "@type": "Thing",
      name: keyword,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <SeoAcquisitionLanding locale={locale} landing={landing} />
    </>
  );
}
