import type { Dictionary, Locale } from "@/lib/i18n";

export function Statistics({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { stats: s } = dict;
  const isRtl = locale === "ar";
  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  return (
    <section id="about" className="relative py-28 lg:py-36">
      <div className="gold-line mx-auto mb-20 max-w-7xl px-6 lg:px-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-20 flex flex-col items-center text-center">
          <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
            {s.sectionLabel}
          </p>
          <h2
            className="max-w-3xl text-5xl font-light text-white md:text-6xl"
            style={{ fontFamily: bodyFont }}
          >
            {s.title}
            <span className="italic text-gold"> {s.titleItalic}</span>
          </h2>
        </div>

        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {s.items.map((stat) => (
            <div
              key={stat.label}
              className="group bg-background p-10 text-center transition-colors duration-500 hover:bg-gray-elevated lg:p-12"
            >
              <p
                className="stat-glow text-5xl font-light text-white transition-colors duration-500 group-hover:text-gold md:text-6xl"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {stat.value}
              </p>
              <p
                className="mt-4 text-[10px] uppercase tracking-[0.3em] text-gray-muted"
                style={{ fontFamily: bodyFont }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <blockquote className="mx-auto mt-24 max-w-3xl text-center">
          <p
            className="text-2xl leading-relaxed font-light text-white/80 md:text-3xl md:leading-relaxed"
            style={{ fontFamily: bodyFont }}
          >
            &ldquo;{s.quote}&rdquo;
          </p>
          <footer className="mt-8 text-[10px] uppercase tracking-[0.35em] text-gold">
            {s.quoteSource}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
