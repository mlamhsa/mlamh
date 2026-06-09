import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

export function Hero({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { hero } = dict;
  const isRtl = locale === "ar";

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const title =
    locale === "ar"
      ? "المنصة السعودية للمواهب والكاست"
      : "A Saudi Talent & Casting Platform";

  const subtitle =
    locale === "ar"
      ? "اكتشف المواهب، الوجوه الجديدة، وصنّاع المحتوى في المملكة العربية السعودية."
      : "Discover talents, fresh faces, and creators across Saudi Arabia.";

  const description =
    locale === "ar"
      ? "مَلامِح تربط المواهب بالوكالات، شركات الإنتاج، والعلامات التجارية من خلال ملفات احترافية وطلبات مباشرة."
      : "MLAMH connects talents with agencies, production companies, and brands through professional profiles and direct casting requests.";

  const searchPlaceholder =
    locale === "ar"
      ? "ابحث عن ممثل، مودل، صانع محتوى..."
      : "Search actor, model, creator...";

  const primaryCta = locale === "ar" ? "استكشف المواهب" : "Explore Talents";
  const talentCta = locale === "ar" ? "انضم كموهبة" : "Join as Talent";
  const agencyCta = locale === "ar" ? "للوكالات" : "For Agencies";

  const marketLabel = locale === "ar" ? "السوق الحالي" : "Current Market";
  const marketValue = locale === "ar" ? "السعودية" : "Saudi Arabia";

  const ctaArrow = isRtl ? "←" : "→";

  return (
    <section className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-black pt-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/4 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-white/[0.025] blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-black/80 to-transparent" />
      </div>

      <div
        className={`pointer-events-none absolute top-32 hidden h-32 w-px bg-gradient-to-b from-gold/50 to-transparent lg:block ${
          isRtl ? "right-6" : "left-6"
        }`}
        aria-hidden
      />

      <div
        className={`pointer-events-none absolute top-32 hidden h-32 w-px bg-gradient-to-b from-gold/50 to-transparent lg:block ${
          isRtl ? "left-6" : "right-6"
        }`}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
        <div className="mb-8 flex items-center gap-4 opacity-0-start animate-fade-up">
          <span className="gold-line max-w-[80px] flex-1" />

          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            {locale === "ar"
              ? "مَلامِح — السعودية أولًا"
              : "MLAMH — Saudi First"}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1
              className="opacity-0-start animate-fade-up delay-100 max-w-5xl text-[clamp(3.2rem,9vw,8.2rem)] font-light leading-[0.95] tracking-[-0.04em] text-white"
              style={{ fontFamily: displayFont }}
            >
              {title}
            </h1>

            <p className="opacity-0-start animate-fade-up delay-200 mt-8 max-w-2xl text-lg leading-8 text-white/70 md:text-2xl md:leading-10">
              {subtitle}
            </p>
          </div>

          <div className="lg:col-span-4">
            <div className="opacity-0-start animate-fade-up delay-300 rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                {marketLabel}
              </p>

              <p
                className="mt-3 text-4xl font-light text-white"
                style={{ fontFamily: displayFont }}
              >
                {marketValue}
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-muted">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="opacity-0-start animate-fade-up delay-400 mt-12 max-w-4xl rounded-[28px] border border-white/[0.08] bg-neutral-950/80 p-3 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex min-h-14 flex-1 items-center rounded-2xl border border-white/[0.06] bg-black/40 px-5 text-sm text-white/35">
              {searchPlaceholder}
            </div>

            <Link
              href={talentPath(locale)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-7 text-[10px] uppercase tracking-[0.28em] text-black transition hover:bg-gold"
            >
              {primaryCta}
            </Link>
          </div>
        </div>

        <div className="opacity-0-start animate-fade-up delay-500 mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href={talentPath(locale)}
            className="btn-luxury group inline-flex items-center justify-center gap-3 border border-gold/40 bg-gold/[0.08] px-8 py-4 text-[10px] uppercase tracking-[0.32em] text-gold transition hover:bg-gold hover:text-black"
          >
            {primaryCta}
            <span
              className={`inline-block transition-transform duration-300 ${
                isRtl
                  ? "group-hover:-translate-x-1"
                  : "group-hover:translate-x-1"
              }`}
            >
              {ctaArrow}
            </span>
          </Link>

          <Link
            href={`/${locale}/talent-login`}
            className="btn-luxury inline-flex items-center justify-center border border-white/15 px-8 py-4 text-[10px] uppercase tracking-[0.32em] text-white/80 transition hover:border-gold/50 hover:text-gold"
          >
            {talentCta}
          </Link>

          <a
            href="#agencies"
            className="btn-luxury inline-flex items-center justify-center border border-white/15 px-8 py-4 text-[10px] uppercase tracking-[0.32em] text-white/80 transition hover:border-gold/50 hover:text-gold"
          >
            {agencyCta}
          </a>
        </div>

        <div className="opacity-0-start animate-fade-in delay-600 mt-20 grid gap-4 border-t border-white/[0.06] pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <HeroMetric
            label={locale === "ar" ? "نوع المنصة" : "Platform Type"}
            value={locale === "ar" ? "كاست ومواهب" : "Casting & Talent"}
          />

          <HeroMetric
            label={locale === "ar" ? "لمن؟" : "Built For"}
            value={locale === "ar" ? "وكالات وإنتاج" : "Agencies & Production"}
          />

          <HeroMetric
            label={locale === "ar" ? "التركيز" : "Focus"}
            value={locale === "ar" ? "وجوه سعودية" : "Saudi Faces"}
          />

<HeroMetric
  label={locale === "ar" ? "الهوية" : "Positioning"}
  value={locale === "ar" ? "منصة سعودية" : "Saudi Platform"}
/>
        </div>

        <div className="mt-10 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-muted">
              {hero.scroll}
            </p>
            <div className="mt-3 h-12 w-px bg-gradient-to-b from-gold/60 to-transparent" />
          </div>

          <p
            className="hidden text-sm text-white/35 sm:block"
            style={{ fontFamily: displayFont }}
          >
            {locale === "ar"
  ? "صُممت في السعودية لصناعة الكاست، الإنتاج، والمحتوى."
  : "Built in Saudi Arabia for casting, production, and content."}
          </p>

          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-muted">
            {hero.disciplines}
          </p>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        aria-hidden
      />
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
      <p className="text-[9px] uppercase tracking-[0.28em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-sm text-white/80">{value}</p>
    </div>
  );
}