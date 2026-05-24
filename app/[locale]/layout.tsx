import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HtmlAttributes } from "@/components/HtmlAttributes";
import { getDictionary, isValidLocale, locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
    keywords: ["casting", "talents", "Saudi Arabia", "models", "agencies", "MLAMH"],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={locale} className="min-h-full">
      <HtmlAttributes locale={locale} />
      {children}
    </div>
  );
}
