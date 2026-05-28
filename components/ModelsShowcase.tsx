import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getTalents } from "@/lib/supabase/talents";
import {
  getTalentCategory,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { talentPath } from "@/lib/utils/routes";

export async function ModelsShowcase({
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const talents = await getTalents();

  return (
    <section className="bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between gap-6">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH TALENTS
            </p>

            <h2
              className="text-4xl font-light tracking-tight md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Discover Talents
            </h2>
          </div>

          <Link
            href={talentPath(locale)}
            className="hidden rounded-full border border-gold/30 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10 md:inline-flex"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {talents.map((talent, index) => {
            const name = getTalentName(talent, locale);

            const category = getTalentCategory(
              talent,
              locale
            );

            return (
              <Link
                key={talent.id}
                href={talentPath(
                  locale,
                  talent.slug ?? talent.id
                )}
                className="group block overflow-hidden rounded-[28px] border border-white/[0.08] bg-neutral-950 transition-all duration-500 hover:-translate-y-1 hover:border-gold/20"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                  <Image
                    src={talent.image_url}
                    alt={name || "Talent image"}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />

                  {talent.featured ? (
                    <div className="absolute top-4 left-4 rounded-full border border-gold/30 bg-black/40 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-gold backdrop-blur">
                      {locale === "ar"
                        ? "مميز"
                        : "Featured"}
                    </div>
                  ) : null}
                </div>

                <div className="p-6">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-gold">
                    {category}
                  </p>

                  <h3
                    className="text-3xl font-light tracking-tight text-white"
                    style={{
                      fontFamily:
                        "var(--font-cormorant)",
                    }}
                  >
                    {name}
                  </h3>

                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-5">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                      {locale === "ar"
                        ? "عرض الملف"
                        : "View Profile"}
                    </span>

                    <span className="text-white/30 transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center md:hidden">
          <Link
            href={talentPath(locale)}
            className="rounded-full border border-gold/30 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}