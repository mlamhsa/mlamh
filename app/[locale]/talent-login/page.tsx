import { redirect, notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";

export const metadata = {
  title: "Talent Login — MLAMH",
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TalentLoginPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;

  redirect(`/${locale}/login`);
}