import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";
import {
  getTalentCategory,
  getTalentName,
} from "@/lib/utils/talent-formatters";
import { talentPath } from "@/lib/utils/routes";

type TalentCityFields = {
  city_ar?: string | null;
  city_en?: string | null;
};

type ShowcaseTalent = Talent & {
  image_url: string;
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
  mobileMode = false,
}: {
  locale: Locale;
  talents: ShowcaseTalent[];
  mobileMode?: boolean;
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

  const isAr = locale === "ar";
  if (mobileMode) {
    const mobileTalents = [
      ...featuredTalents,
      ...latestTalents,
    ].slice(0, 8);

    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="relative overflow-hidden"
      >
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mobileTalents.map((talent, index) => (
            <div
              key={talent.id}
              className="w-[72vw] max-w-[286px] shrink-0 snap-start"
            >
              <TalentCard
                talent={talent}
                locale={locale}
                priority={index < 2}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const sectionLabel = isAr ? "مواهب ملامح" : "MLAMH Talents";

  const featuredLabel =
    isAr ? "اختيارات مميزة" : "Featured Picks";

  const latestLabel = isAr ? "أحدث المواهب" : "Latest Talents";

  const viewAll =
    isAr ? "استكشف جميع المواهب" : "View All Talents";

  return (
    <section
      id="talents"
      dir={isAr ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-black py-2 text-white lg:border-t lg:border-white/10 lg:px-6 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-white/[0.03] blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
      <div className="mb-10 hidden gap-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p
              className={[
                "mb-3 text-[10px] text-gold",
                isAr
                  ? "tracking-normal"
                  : "uppercase tracking-[0.4em]",
              ].join(" ")}
            >
              {sectionLabel}
            </p>

            <h2 className="max-w-4xl text-4xl font-light leading-[1.15] tracking-normal md:text-6xl lg:text-7xl">
              {isAr
                ? "وجوه تُختار بعناية لصناعة المشهد القادم"
                : "Carefully Selected Faces Shaping the Next Scene"}
            </h2>
          </div>

          <Link
            href={talentPath(locale)}
            className={[
              "inline-flex w-fit items-center justify-center gap-3 rounded-full border border-gold/30 bg-gold/[0.06] px-6 py-3 text-[10px] text-gold transition hover:bg-gold hover:text-black",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.26em]",
            ].join(" ")}
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
  talents: ShowcaseTalent[];
  locale: Locale;
  priority?: boolean;
}) {
  const count = talents.length;

  const gridClass =
    count === 2
      ? "grid max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2"
      : count === 3
        ? "grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5";

  return (
    <div className="mb-8 last:mb-0 lg:mb-16">
      {/* Mobile */}
      <div className="lg:hidden">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {talents.slice(0, 6).map((talent, index) => (
            <div
              key={talent.id}
              className="w-[72vw] max-w-[280px] shrink-0 snap-start"
            >
              <TalentCard
                talent={talent}
                locale={locale}
                priority={priority && index < 2}
                compact
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <div className="mb-7 flex items-center gap-5">
          <h3 className="shrink-0 text-2xl font-light tracking-normal md:text-3xl">
            {title}
          </h3>

          <div className="h-px flex-1 bg-gradient-to-r from-gold/30 via-white/10 to-transparent" />
        </div>

        {count === 1 ? (
          <TalentSpotlight
            talent={talents[0]}
            locale={locale}
            priority={priority}
          />
        ) : (
          <div className={gridClass}>
            {talents.map((talent, index) => (
              <TalentCard
                key={talent.id}
                talent={talent}
                locale={locale}
                priority={priority && index < 5}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TalentSpotlight({
  talent,
  locale,
  priority = false,
}: {
  talent: ShowcaseTalent;
  locale: Locale;
  priority?: boolean;
}) {
  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);
  const isAr = locale === "ar";

  return (
    <Link
      href={getProfileHref(locale, talent)}
      className="group grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] transition duration-300 hover:border-gold/35 md:grid-cols-[minmax(280px,0.8fr)_1.2fr]"
    >
      <div className="relative min-h-[380px] overflow-hidden bg-neutral-900 md:min-h-[500px]">
        <Image
          src={talent.image_url}
          alt={name || "Talent"}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 45vw"
          className="object-cover transition duration-700 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {talent.featured && (
          <div
            className={[
              "absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-black/65 px-3 py-1.5 text-[9px] text-gold backdrop-blur",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.18em]",
            ].join(" ")}
          >
            <BadgeCheck size={12} />
            {isAr ? "مميز" : "Featured"}
          </div>
        )}
      </div>

      <div className="relative flex min-h-[320px] flex-col justify-between p-7 md:p-9 lg:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-gold/[0.05] blur-[90px]" />

        <div className="relative">
          <p
            className={[
              "text-[10px] text-gold",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.28em]",
            ].join(" ")}
          >
            {isAr ? "موهبة تستحق الاكتشاف" : "Talent to discover"}
          </p>

          <h4 className="mt-5 text-4xl font-light tracking-normal text-white md:text-5xl lg:text-6xl">
            {name}
          </h4>

          <p className="mt-5 text-sm tracking-normal text-white/50 md:text-base">
            {[category, city].filter(Boolean).join(" • ")}
          </p>

          <p className="mt-6 max-w-xl text-sm leading-7 tracking-normal text-white/55 md:text-base md:leading-8">
            {isAr
              ? "اكتشف الملف المهني، الصور، والمعلومات الكاملة لهذه الموهبة."
              : "Explore the professional profile, portfolio, and complete talent details."}
          </p>
        </div>

        <div className="relative mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
        <span className="text-sm tracking-normal text-white/65">
  {isAr ? "عرض الملف الكامل" : "View Full Profile"}
</span>

<span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition duration-300 group-hover:bg-gold group-hover:text-black">
  <ArrowUpRight size={16} />
</span>
        </div>
      </div>
    </Link>
  );
}

function TalentCard({
  talent,
  locale,
  priority = false,
  compact = false,
}: {
  talent: ShowcaseTalent;
  locale: Locale;
  priority?: boolean;
  compact?: boolean;
}) {
  const name = getTalentName(talent, locale);
  const category = getTalentCategory(talent, locale);
  const city = getTalentCity(talent, locale);
  const isAr = locale === "ar";

  return (
    <Link
      href={getProfileHref(locale, talent)}
      className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-2 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:bg-white/[0.055]"
    >
      <div
  className={[
    "relative overflow-hidden rounded-[1.25rem] bg-neutral-900",
    compact ? "aspect-[3/4]" : "aspect-[4/5]",
  ].join(" ")}
>
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
          <div
            className={[
              "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-black/65 px-3 py-1 text-[9px] text-gold backdrop-blur",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.18em]",
            ].join(" ")}
          >
            <BadgeCheck size={12} />
            {isAr ? "مميز" : "Featured"}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p
            className={[
              "mb-1 truncate text-[10px] text-gold/90",
              isAr
                ? "tracking-normal"
                : "uppercase tracking-[0.22em]",
            ].join(" ")}
          >
            {[category, city].filter(Boolean).join(" • ")}
          </p>

          <h4 className="truncate text-lg font-light tracking-normal text-white">
            {name}
          </h4>
        </div>
      </div>

      {!compact && (
  <div className="flex items-center justify-between px-3 py-3">
    <p className="text-[11px] tracking-normal text-white/45">
      {isAr ? "عرض الملف" : "View Profile"}
    </p>

    <span className="text-sm text-gold transition group-hover:translate-x-0.5">
      {isAr ? "←" : "→"}
    </span>
  </div>
)}
    </Link>
  );
}