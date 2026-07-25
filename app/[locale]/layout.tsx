import { Navbar } from "@/components/Navbar";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";

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
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black"
    >
      {/* نسخة الديسكتوب فقط */}
      <div className="hidden lg:block">
        <Navbar locale={locale} />
      </div>

      {/* نسخة التطبيق على الجوال فقط */}
      <MobileAppShell locale={locale} />

      <main className="min-h-screen pb-24 pt-16 lg:pb-0 lg:pt-0">
        {children}
      </main>
    </div>
  );
}