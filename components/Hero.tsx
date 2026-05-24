import type { Dictionary, Locale } from "@/lib/i18n";

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
  const ctaArrow = isRtl ? "←" : "→";

  return (
    <section className="relative flex min-h-screen flex-col justify-end overflow-hidden pt-20">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gold/[0.03] blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] bg-white/[0.02] blur-[100px]" />
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
          <span className="gold-line flex-1 max-w-[80px]" />
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            {hero.eyebrow}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-8">
            <h1
              className="opacity-0-start animate-fade-up delay-100 text-[clamp(3.5rem,12vw,9rem)] leading-[0.9] font-light tracking-[-0.02em] text-white"
              style={{ fontFamily: displayFont }}
            >
              {hero.titleLine1}
              <br />
              <span className="italic text-white/90">{hero.titleLine2}</span>
              <br />
              {hero.titleLine3}
            </h1>
          </div>

          <div className="flex flex-col justify-end lg:col-span-4">
            <p
              className={`opacity-0-start animate-fade-up delay-300 mb-6 text-2xl leading-relaxed text-white/80 lg:text-3xl ${
                isRtl ? "text-right" : "text-left lg:text-right"
              }`}
              style={{ fontFamily: displayFont }}
            >
              {hero.subtitle}
            </p>
            <p
              className={`opacity-0-start animate-fade-up delay-400 max-w-sm text-sm leading-relaxed text-gray-muted ${
                isRtl ? "lg:mr-auto lg:text-right" : "lg:ml-auto lg:text-right"
              }`}
            >
              {hero.description}
            </p>
          </div>
        </div>

        <div className="opacity-0-start animate-fade-up delay-500 mt-14 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <a
            href="#talents"
            className="btn-luxury group inline-flex items-center justify-center gap-3 bg-white px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-black transition-colors hover:bg-gold hover:text-black"
          >
            {hero.ctaTalents}
            <span
              className={`inline-block transition-transform duration-300 ${
                isRtl
                  ? "group-hover:-translate-x-1"
                  : "group-hover:translate-x-1"
              }`}
            >
              {ctaArrow}
            </span>
          </a>
          <a
            href="#agencies"
            className="btn-luxury inline-flex items-center justify-center border border-white/20 px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-white/90 transition-colors hover:border-gold/60 hover:text-gold"
          >
            {hero.ctaAgencies}
          </a>
        </div>

        <div className="opacity-0-start animate-fade-in delay-600 mt-20 flex items-end justify-between border-t border-white/[0.06] pt-8">
          <div className="flex gap-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-muted">
                {hero.scroll}
              </p>
              <div className="mt-3 h-12 w-px bg-gradient-to-b from-gold/60 to-transparent" />
            </div>
          </div>
          <p
            className="hidden text-sm text-white/40 sm:block"
            style={{ fontFamily: displayFont }}
          >
            {hero.brandLine}
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
