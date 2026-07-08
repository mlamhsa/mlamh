import { Navbar } from "@/components/Navbar";

type Locale = "ar" | "en";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  const locale: Locale = rawLocale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <Navbar locale={locale} />
      {children}
    </div>
  );
}