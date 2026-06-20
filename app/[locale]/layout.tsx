import { Navbar } from "@/components/Navbar";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <>
      <Navbar locale={locale as Locale} />
      <main className="pt-20">{children}</main>
    </>
  );
}