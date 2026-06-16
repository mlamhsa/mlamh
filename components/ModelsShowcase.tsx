import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
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
  talents,
}: {
  locale: Locale;
  talents: any[];
}) {
  if (!Array.isArray(talents) || talents.length === 0) {
    return null;
  }

  const visibleTalents = talents.filter((talent) => talent?.image_url);

  if (visibleTalents.length === 0) {
    return null;
  }

  const featuredTalents = visibleTalents
    .filter((talent) => talent.featured)
    .slice(0, 6);

  const spotlightTalent =
    featuredTalents?.[0] || visibleTalents?.[0] || null;

  const latestTalents = visibleTalents
    .filter((talent) => talent.id !== spotlightTalent?.id)
    .slice(0, 6);

  const sectionLabel = locale === "ar" ? "مواهب ملامح" : "MLAMH Talents";
  const spotlightLabel = locale === "ar" ? "موهبة مميزة" : "Talent Spotlight";
  const featuredLabel =
    locale === "ar" ? "المواهب المميزة" : "Featured Talents";
  const latestLabel = locale === "ar" ? "أحدث المواهب" : "Latest Talents";

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

            <h2 className="max-w-3xl text-4xl font-light md:text-7xl">
              {locale === "ar"
                ? "وجوه تُختار بعناية لصناعة المشهد القادم"
                : "Carefully Selected Faces Shaping the Next Scene"}
            </h2>
          </div>

          <Link
            href={talentPath(locale)}
            className="inline-flex w-fit rounded-full border border-gold/30 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold"
          >
            {viewAll}
          </Link>
        </div>

        {spotlightTalent && (
          <Link
            href={getProfileHref(locale, spotlightTalent)}
            className="group mb-20 grid overflow-hidden rounded-[36px] border border-white/[0.08] bg-neutral-950 lg:grid-cols-[0.56fr_0.44fr]"
          >
            <div className="relative min-h-[560px] overflow-hidden bg-neutral-900 lg:min-h-[680px]">
              <Image
                src={spotlightTalent.image_url}
                alt={getTalentName(spotlightTalent, locale) || "Talent"}
                fill
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute left-6 top-6 text-[10px] uppercase text-gold">
                {spotlightLabel}
              </div>
            </div>

            <div className="p-10 flex flex-col justify-between">
              <div>
                <p className="mb-4 text-[10px] uppercase text-gold">
                  {locale === "ar" ? "اختيار ملامح" : "Selection"}
                </p>

                <h3 className="text-5xl font-light">
                  {getTalentName(spotlightTalent, locale)}
                </h3>

                <p className="mt-4 text-white/60">
                  {[
                    getTalentCategory(spotlightTalent, locale),
                    getTalentCity(spotlightTalent, locale),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>

              <p className="text-white/50 text-sm mt-6">
                {locale === "ar"
                  ? "ملف موهبة مختار للواجهة الرئيسية."
                  : "Highlighted talent profile on homepage."}
              </p>
            </div>
          </Link>
        )}

        {featuredTalents.length > 0 && (
          <div className="mb-20">
            <h3 className="mb-8 text-3xl font-light">{featuredLabel}</h3>

            <div className="grid md:grid-cols-3 gap-6">
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
        )}

        {latestTalents.length > 0 && (
          <div>
            <h3 className="mb-8 text-3xl font-light">{latestLabel}</h3>

            <div className="grid md:grid-cols-3 gap-6">
              {latestTalents.map((talent) => (
                <TalentCard
                  key={talent.id}
                  talent={talent}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TalentCard({
  talent,
  locale,
  priority = false,
}: {
  talent: any;
  locale: Locale;
  priority?: boolean;
}) {
  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);

  return (
    <Link
      href={getProfileHref(locale, talent)}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-950"
    >
      <div className="relative aspect-[3/4]">
        <Image
          src={talent.image_url}
          alt={name || "Talent"}
          fill
          priority={priority}
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {talent.featured && (
          <div className="absolute left-4 top-4 text-[9px] uppercase text-gold">
            {locale === "ar" ? "مميز" : "Featured"}
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs text-gold">
          {[category, city].filter(Boolean).join(" • ")}
        </p>

        <h4 className="text-xl font-light">{name}</h4>

        <p className="text-white/50 text-xs mt-2">
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </p>
      </div>
    </Link>
  );
}