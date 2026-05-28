import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import { FEATURED_TALENTS_LIMIT } from "@/lib/constants/ui";
import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

export function FeaturedTalentGrid({
  talents,
  locale,
}: {
  talents: Talent[];
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const featuredTalents = talents
    .filter((talent) => talent.featured)
    .slice(0, FEATURED_TALENTS_LIMIT);

  if (featuredTalents.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
            {isRtl ? "مختارات مميزة" : "Featured Selection"}
          </p>

          <h2
            className="text-3xl font-light text-white md:text-5xl"
            style={{
              fontFamily: isRtl
                ? "var(--font-noto-arabic)"
                : "var(--font-cormorant)",
            }}
          >
            {isRtl ? "مواهب بارزة" : "Highlighted Talents"}
          </h2>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {featuredTalents.map((talent) => (
          <PublicTalentCard
            key={talent.id}
            talent={talent}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}