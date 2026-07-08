import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
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
    .slice(0, 10);

  const latestTalents = visibleTalents
    .filter((talent) => !talent.featured)
    .slice(0, 10);

  const sectionLabel = locale === "ar" ? "مواهب ملامح" : "MLAMH Talents";

  const featuredLabel =
    locale === "ar" ? "اختيارات مميزة" : "Featured Picks";

  const latestLabel = locale === "ar" ? "أحدث المواهب" : "Latest Talents";

  const viewAll =
    locale === "ar" ? "استكشف جميع المواهب" : "View All Talents";

  return (
    <section id="talents" className="relative overflow-hidden bg-black px-6 py-24 text-white md:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-white/[0.03] blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
              {sectionLabel}
            </p>

            <h2 className="max-w-3xl text-4xl font-light leading-tight md:text-7xl md:leading-[1.05]">
              {locale === "ar"
                ? "وجوه تُختار بعناية لصناعة المشهد القادم"
                : "Carefully Selected Faces Shaping the Next Scene"}
            </h2>
          </div>

          <Link
  href={talentPath(locale)}
  className="inline-flex w-fit items-center justify-center gap-3 rounded-full border border-gold/30 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.26em] text-gold transition hover:bg-gold hover:text-black"
>
  {viewAll}
  <ArrowUpRight size={14} />
</Link>
        </div>

        {featuredTalents.length > 0 && (
          <TalentSection
            title={featuredLabel}
            talents={featuredTalents}
            locale={locale}
            priority
          />
        )}

        {latestTalents.length > 0 && (
          <TalentSection
            title={latestLabel}
            talents={latestTalents}
            locale={locale}
          />
        )}
      </div>
    </section>
  );
}

function TalentSection({
  title,
  talents,
  locale,
  priority = false,
}: {
  title: string;
  talents: any[];
  locale: Locale;
  priority?: boolean;
}) {
  return (
    <div className="mb-20 last:mb-0">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h3 className="text-2xl font-light md:text-4xl">{title}</h3>
        <div className="hidden h-px flex-1 bg-gradient-to-r from-gold/30 via-white/10 to-transparent md:block" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 lg:gap-5">
        {talents.map((talent, index) => (
          <TalentCard
            key={talent.id}
            talent={talent}
            locale={locale}
            priority={priority && index < 5}
          />
        ))}
      </div>
    </div>
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
      className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-2 transition duration-300 hover:-translate-y-1 hover:border-gold/45 hover:bg-white/[0.06]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-neutral-900">
        <Image
          src={talent.image_url}
          alt={name || "Talent"}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {talent.featured && (
  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-black/65 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-gold backdrop-blur">
    <BadgeCheck size={12} />
    {locale === "ar" ? "مميز" : "Featured"}
  </div>
)}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="mb-1 truncate text-[10px] uppercase tracking-[0.22em] text-gold/90">
            {[category, city].filter(Boolean).join(" • ")}
          </p>

          <h4 className="truncate text-lg font-light text-white">
            {name}
          </h4>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-3">
        <p className="text-[11px] text-white/45">
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </p>

        <span className="text-sm text-gold transition group-hover:translate-x-0.5">
          {locale === "ar" ? "←" : "→"}
        </span>
      </div>
    </Link>
  );
}