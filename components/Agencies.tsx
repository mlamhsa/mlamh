import { agencies } from "@/lib/data";
import type { Dictionary, Locale } from "@/lib/i18n";

export function Agencies({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { agencies: a } = dict;
  const isRtl = locale === "ar";
  const doubled = [...agencies, ...agencies];
  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <section id="agencies" className="relative overflow-hidden py-28 lg:py-36">
      <div className="absolute inset-0 bg-gray-deep" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,98,0.06)_0%,transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-20 text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
            {a.sectionLabel}
          </p>
          <h2
            className="text-5xl font-light text-white md:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {a.title}
            <span className="italic"> {a.titleItalic}</span>
          </h2>
          <p
            className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-gray-muted"
            style={{ fontFamily: bodyFont }}
          >
            {a.description}
          </p>
        </div>

        <div className="relative mb-16 overflow-hidden">
          <div
            className={`pointer-events-none absolute top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-gray-deep to-transparent ${
              isRtl ? "right-0" : "left-0"
            }`}
          />
          <div
            className={`pointer-events-none absolute top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-gray-deep to-transparent ${
              isRtl ? "left-0" : "right-0"
            }`}
          />
          <div className="flex w-max animate-marquee">
            {doubled.map((agency, i) => (
              <div
                key={`${agency.name}-${i}`}
                className="mx-6 flex min-w-[220px] flex-col items-center border border-white/[0.06] bg-black/40 px-10 py-8 backdrop-blur-sm transition-colors duration-500 hover:border-gold/30"
              >
                <span
                  className="text-center text-xl font-light tracking-wide text-white/90"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  {agency.name}
                </span>
                <span className="mt-2 text-[9px] uppercase tracking-[0.35em] text-gold/70">
                  {agency.region}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div
            className={`border border-white/[0.06] p-8 lg:p-10 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <h3
              className="mb-4 text-3xl font-light text-white"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {a.cardDirectorsTitle}
            </h3>
            <p
              className="text-sm leading-relaxed text-gray-muted"
              style={{ fontFamily: bodyFont }}
            >
              {a.cardDirectorsBody}
            </p>
            <a
              href="#contact"
              className="btn-luxury mt-8 inline-block text-[10px] uppercase tracking-[0.3em] text-gold transition-colors hover:text-gold-soft"
            >
              {a.cardDirectorsCta}
            </a>
          </div>
          <div
            className={`border border-gold/20 bg-gold/[0.03] p-8 lg:p-10 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <h3
              className="mb-4 text-3xl font-light text-white"
              style={{ fontFamily: bodyFont }}
            >
              {a.cardPartnersTitle}
            </h3>
            <p
              className="text-sm leading-relaxed text-white/60"
              style={{ fontFamily: bodyFont }}
            >
              {a.cardPartnersBody}
            </p>
            <a
              href="#contact"
              className="btn-luxury mt-8 inline-block text-[10px] uppercase tracking-[0.3em] text-gold transition-colors hover:text-gold-soft"
            >
              {a.cardPartnersCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
