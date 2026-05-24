import Image from "next/image";
import { talentImages } from "@/lib/data";
import type { Dictionary, Locale } from "@/lib/i18n";

export function ModelsShowcase({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { talents: t } = dict;
  const isRtl = locale === "ar";
  const nameFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  return (
    <section id="talents" className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
              {t.sectionLabel}
            </p>
            <h2
              className="text-5xl font-light tracking-tight text-white md:text-6xl lg:text-7xl"
              style={{ fontFamily: nameFont }}
            >
              {t.title}
              <span className="italic"> {t.titleItalic}</span>
            </h2>
          </div>
          <p
            className={`max-w-md text-sm leading-relaxed text-gray-muted ${
              isRtl ? "text-right" : "lg:text-right"
            }`}
            style={{
              fontFamily: isRtl
                ? "var(--font-noto-arabic)"
                : "var(--font-dm-sans)",
            }}
          >
            {t.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((talent, index) => (
            <article
              key={talent.name}
              className={`talent-card group relative overflow-hidden bg-gray-elevated ${
                index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            >
              <div
                className={`relative overflow-hidden ${
                  index === 0
                    ? "aspect-[4/5] sm:aspect-auto sm:h-full sm:min-h-[520px]"
                    : "aspect-[3/4]"
                }`}
              >
                <Image
                  src={talentImages[index]}
                  alt={talent.name}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 640px) 100vw, 66vw"
                      : "(max-width: 640px) 50vw, 33vw"
                  }
                  className="talent-image object-cover object-top grayscale-[30%] transition-[filter] duration-700 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
              </div>

              <div
                className={`absolute bottom-0 left-0 right-0 p-6 lg:p-8 ${
                  isRtl ? "text-right" : "text-left"
                }`}
              >
                <span className="mb-2 inline-block text-[9px] uppercase tracking-[0.35em] text-gold">
                  {talent.category}
                </span>
                <h3
                  className="text-2xl font-light text-white lg:text-3xl"
                  style={{ fontFamily: nameFont }}
                >
                  {talent.name}
                </h3>
              </div>

              <div
                className={`absolute top-4 flex h-10 w-10 items-center justify-center border border-white/10 bg-black/40 text-white/0 backdrop-blur-sm transition-all duration-500 group-hover:border-gold/40 group-hover:text-gold ${
                  isRtl ? "left-4" : "right-4"
                }`}
              >
                <span
                  className={`text-lg transition-transform duration-500 ${
                    isRtl
                      ? "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
                      : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  }`}
                >
                  {isRtl ? "↖" : "↗"}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="#contact"
            className="btn-luxury border-b border-gold/40 pb-1 text-[10px] uppercase tracking-[0.35em] text-gold transition-colors hover:border-gold hover:text-gold-soft"
          >
            {t.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
