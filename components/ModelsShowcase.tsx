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
    .slice(0, 10);

  const latestTalents = visibleTalents
    .filter((talent) => !talent.featured)
    .slice(0, 10);

  const sectionLabel = locale === "ar" ? "مواهب ملامح" : "MLAMH Talents";

  const featuredLabel =
    locale === "ar" ? "اختيارات ملامح" : "MLAMH Picks";

  const featuredDescription =
    locale === "ar"
      ? "مواهب مختارة بعناية لملفات مكتملة وجاهزة للفرص."
      : "Curated talent profiles selected for complete, opportunity-ready presentation.";

  const latestLabel = locale === "ar" ? "أحدث المواهب" : "Latest Talents";

  const latestDescription =
    locale === "ar"
      ? "آخر الملفات التي انضمت إلى المنصة وتم تحديثها مؤخراً."
      : "Recently added and updated talent profiles on the platform.";

  const viewAll =
    locale === "ar" ? "استكشف جميع المواهب" : "View All Talents";

  return (
    <section id="talents" className="bg-black px-6 py-24 text-white">
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
            className="inline-flex w-fit rounded-full border border-gold/30 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition-colors hover:border-gold hover:bg-gold/10"
          >
            {viewAll}
          </Link>
        </div>

        {featuredTalents.length > 0 && (
          <TalentSection
            title={featuredLabel}
            description={featuredDescription}
            talents={featuredTalents}
            locale={locale}
            priority
          />
        )}

        {latestTalents.length > 0 && (
          <TalentSection
            title={latestLabel}
            description={latestDescription}
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
  description,
  talents,
  locale,
  priority = false,
}: {
  title: string;
  description: string;
  talents: any[];
  locale: Locale;
  priority?: boolean;
}) {
  return (
    <div className="mb-20 last:mb-0">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-3xl font-light md:text-4xl">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            {description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
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
      className="group overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 transition duration-300 hover:-translate-y-1 hover:border-gold/40"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
        <Image
          src={talent.image_url}
          alt={name || "Talent"}
          fill
          priority={priority}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {talent.featured && (
          <div className="absolute left-3 top-3 rounded-full border border-gold/30 bg-black/60 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-gold backdrop-blur">
            {locale === "ar" ? "مميز" : "Featured"}
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="truncate text-[11px] text-gold">
          {[category, city].filter(Boolean).join(" • ")}
        </p>

        <h4 className="mt-1 truncate text-base font-medium text-white">
          {name}
        </h4>

        <p className="mt-3 text-[11px] text-white/45">
          {locale === "ar" ? "عرض الملف" : "View Profile"}
        </p>
      </div>
    </Link>
  );
}