import { Footer } from "@/components/Footer";
import { JoinTalentForm } from "@/components/JoinTalentForm";
import { Navbar } from "@/components/Navbar";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    return {};
  }

  const dict = getDictionary(localeParam as Locale);

  return {
    title: `${dict.join.metadataTitle} | MLAMH`,
    description: dict.join.metadataDescription,
  };
}

export default async function JoinPage({ params }: PageProps) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const j = dict.join;
  const isRtl = locale === "ar";
  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";
  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <main className="relative z-[2] bg-background">
      <Navbar dict={dict} locale={locale} />

      <div className="relative overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute top-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 lg:max-w-4xl lg:px-10">
          <header
            className={`mb-14 md:mb-16 ${isRtl ? "text-right" : "text-left"}`}
          >
            <div
              className={`mb-6 flex items-center gap-4 ${
                isRtl ? "flex-row-reverse" : ""
              }`}
            >
              <span className="gold-line max-w-[80px] flex-1" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
                {j.eyebrow}
              </p>
            </div>
            <h1
              className="text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.95] font-light text-white"
              style={{ fontFamily: displayFont }}
            >
              {j.title}
              <span className="italic text-white/85"> {j.titleItalic}</span>
            </h1>
            <p
              className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-muted md:text-base"
              style={{ fontFamily: bodyFont }}
            >
              {j.description}
            </p>
          </header>

          <JoinTalentForm dict={dict} locale={locale} />
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
          aria-hidden
        />
      </div>

      <Footer dict={dict} locale={locale} />
    </main>
  );
}
