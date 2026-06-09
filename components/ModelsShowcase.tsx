import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getTalents } from "@/lib/supabase/talents";
import {
  getTalentCategory,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { talentPath } from "@/lib/utils/routes";

type TalentCityFields = {
  city_ar?: string | null;
  city_en?: string | null;
};

function getTalentCity(talent: TalentCityFields, locale: Locale) {
  return locale === "ar" ? talent.city_ar : talent.city_en;
}

function getProfileHref(
  locale: Locale,
  talent: { id: number | string; slug?: string | null }
) {
  return talentPath(locale, talent.slug ?? talent.id);
}

export async function ModelsShowcase({
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const talents = await getTalents();

  const visibleTalents = talents.filter((talent) => Boolean(talent.image_url));
  const featuredTalents = visibleTalents
    .filter((talent) => talent.featured)
    .slice(0, 6);

  const spotlightTalent = featuredTalents[0] ?? visibleTalents[0];

  const latestTalents = visibleTalents
    .filter((talent) => talent.id !== spotlightTalent?.id)
    .slice(0, 6);

  if (!spotlightTalent && visibleTalents.length === 0) {
    return null;
  }

  const sectionLabel = locale === "ar" ? "مواهب ملامح" : "MLAMH Talents";
  const spotlightLabel = locale === "ar" ? "موهبة مميزة" : "Talent Spotlight";
  const featuredLabel =
    locale === "ar" ? "المواهب المميزة" : "Featured Talents";
  const latestLabel = locale === "ar" ? "أحدث المواهب" : "Latest Talents";
  const viewProfile = locale === "ar" ? "عرض الملف" : "View Profile";
  const viewAll =
    locale === "ar" ? "استكشف جميع المواهب" : "View All Talents";

  return (
    <section className="bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
              {sectionLabel}
            </p>

            <h2
              className="max-w-3xl text-4xl font-light tracking-tight md:text-7xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              {locale === "ar"
                ? "اكتشف الوجوه التي تصنع المشهد"
                : "Discover Faces Shaping the Scene"}
            </h2>
          </div>

          <Link
            href={talentPath(locale)}
            className="inline-flex w-fit rounded-full border border-gold/30 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
          >
            {viewAll}
          </Link>
        </div>

        {spotlightTalent ? (
          <Link
            href={getProfileHref(locale, spotlightTalent)}
            className="group mb-20 grid overflow-hidden rounded-[36px] border border-white/[0.08] bg-neutral-950 transition hover:border-gold/25 lg:grid-cols-[0.56fr_0.44fr]"
          >
            <div className="relative min-h-[560px] overflow-hidden bg-neutral-900 lg:min-h-[680px]">
              <Image
                src={spotlightTalent.image_url}
                alt={
                  getTalentName(spotlightTalent, locale) || "Talent spotlight"
                }
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 56vw"
                className="object-cover object-center transition duration-700 group-hover:scale-[1.015]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

              <div className="absolute left-6 top-6 rounded-full border border-gold/30 bg-black/45 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-gold backdrop-blur">
                {spotlightLabel}
              </div>
            </div>

            <div className="flex min-h-[480px] flex-col justify-between p-8 md:p-12 lg:min-h-[680px]">
              <div>
                <p className="mb-5 text-[10px] uppercase tracking-[0.4em] text-gold">
                  {locale === "ar" ? "اختيار ملامح" : "MLAMH Selection"}
                </p>

                <h3
                  className="max-w-xl text-5xl font-light tracking-tight md:text-7xl"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  {getTalentName(spotlightTalent, locale)}
                </h3>

                <p className="mt-6 text-sm uppercase tracking-[0.25em] text-white/45">
                  {[
                    getTalentCategory(spotlightTalent, locale),
                    getTalentCity(spotlightTalent, locale),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>

              <div>
                <p className="max-w-md text-sm leading-7 text-white/50">
                  {locale === "ar"
                    ? "ملف موهبة مختار للظهور في واجهة ملامح، مصمم لإبراز الحضور، المجال، والجاهزية لفرص الكاست والإنتاج."
                    : "A selected talent profile highlighted on MLAMH to showcase presence, category, and readiness for casting and production opportunities."}
                </p>

                <div className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-6">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gold">
                    {viewProfile}
                  </span>

                  <span className="text-2xl text-white/40 transition group-hover:translate-x-1 group-hover:text-gold">
                    →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : null}

        {featuredTalents.length > 0 ? (
          <div className="mb-20">
            <div className="mb-8 flex items-center justify-between">
              <h3
                className="text-3xl font-light md:text-5xl"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {featuredLabel}
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredTalents.map((talent, index) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  locale={locale}
                  priority={index < 2}
                />
              ))}
            </div>
          </div>
        ) : null}

        {latestTalents.length > 0 ? (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h3
                className="text-3xl font-light md:text-5xl"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                {latestLabel}
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestTalents.map((talent) => (
                <TalentCard key={talent.id} talent={talent} locale={locale} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TalentCard({
  talent,
  locale,
  priority = false,
}: {
  talent: Awaited<ReturnType<typeof getTalents>>[number];
  locale: Locale;
  priority?: boolean;
}) {
  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);

  return (
    <Link
      href={getProfileHref(locale, talent)}
      className="group block overflow-hidden rounded-[30px] border border-white/[0.08] bg-neutral-950 transition duration-500 hover:-translate-y-1 hover:border-gold/25"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
        <Image
          src={talent.image_url}
          alt={name || "Talent image"}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center transition duration-700 group-hover:scale-[1.035]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

        {talent.featured ? (
          <div className="absolute left-4 top-4 rounded-full border border-gold/30 bg-black/50 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-gold backdrop-blur">
            {locale === "ar" ? "مميز" : "Featured"}
          </div>
        ) : null}

        <div className="absolute bottom-5 left-5 right-5">
          <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-gold">
            {[category, city].filter(Boolean).join(" • ")}
          </p>

          <h4
            className="text-3xl font-light tracking-tight text-white"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {name}
          </h4>
        </div>
      </div>

      <div className="flex items-center justify-between p-5">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </span>

        <span className="text-white/30 transition group-hover:translate-x-1 group-hover:text-gold">
          →
        </span>
      </div>
    </Link>
  );
}