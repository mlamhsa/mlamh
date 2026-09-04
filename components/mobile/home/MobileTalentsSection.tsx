import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { MobileTalentShowcase } from "@/components/mobile/home/MobileTalentShowcase";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

type MobileTalent = Talent & {
  image_url: string;
};

type MobileTalentsSectionProps = {
  locale: Locale;
  talents: MobileTalent[];
};

export function MobileTalentsSection({
  locale,
  talents,
}: MobileTalentsSectionProps) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const featuredTalents = talents.filter((talent) => talent.featured);
  const regularTalents = talents.filter((talent) => !talent.featured);
  const hasFeaturedTalents = featuredTalents.length > 0;
  const visibleTalents = hasFeaturedTalents ? featuredTalents : regularTalents;

  if (visibleTalents.length === 0) {
    return null;
  }

  const eyebrow = hasFeaturedTalents
    ? isArabic
      ? "مواهب مميزة"
      : "FEATURED TALENT"
    : isArabic
      ? "أحدث المواهب"
      : "LATEST TALENT";

  const title = hasFeaturedTalents
    ? isArabic
      ? "مواهب مميزة تستحق الاكتشاف"
      : "Featured talent worth discovering"
    : isArabic
      ? "وجوه جديدة على ملامح"
      : "New faces on MLAMH";

  const description = hasFeaturedTalents
    ? isArabic
      ? "مواهب لديها ميزة مفعلة حاليًا وتظهر بشكل مميز على ملامح."
      : "Talent with an active featured benefit currently highlighted on MLAMH."
    : isArabic
      ? "اكتشف أحدث الملفات المهنية المنشورة على ملامح."
      : "Discover the latest professional profiles published on MLAMH.";

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden pb-11 pt-2"
    >
      <div className="pointer-events-none absolute -end-28 top-8 h-64 w-64 rounded-full bg-gold/[0.035] blur-[100px]" />

      <div className="relative px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Sparkles
                size={14}
                strokeWidth={1.7}
                className="text-gold"
              />

              <span className="text-[11px] font-medium text-gold/80">
                {eyebrow}
              </span>
            </div>

            <h2 className="mt-2 max-w-[17rem] text-[1.55rem] font-semibold leading-[1.22] text-white">
              {title}
            </h2>

            <p className="mt-2 max-w-[18rem] text-[13px] leading-6 text-white/38">
              {description}
            </p>
          </div>

          <Link
            href={`/${locale}/talent`}
            className="mt-7 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-xs text-white/45 transition active:scale-[0.98] active:border-gold/20 active:text-gold"
          >
            <span>
              {isArabic ? "عرض الكل" : "View all"}
            </span>

            <DirectionArrow size={13} />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <div className="h-px w-12 bg-gold/35" />
        </div>
      </div>

      <div className="relative mt-5">
        <MobileTalentShowcase
          locale={locale}
          talents={visibleTalents}
        />
      </div>
    </section>
  );
}
