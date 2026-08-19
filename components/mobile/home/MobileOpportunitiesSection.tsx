import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";

import { MobileOpportunitiesList } from "@/components/mobile/home/MobileOpportunitiesList";

import type { Locale } from "@/lib/i18n";

export function MobileOpportunitiesSection({
  locale,
}: {
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden pb-8 pt-1"
    >
      {/* Ambient layer */}
      <div className="pointer-events-none absolute -start-28 top-8 h-64 w-64 rounded-full bg-gold/[0.03] blur-[100px]" />

      {/* Section header */}
      <div className="relative px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness
                size={14}
                strokeWidth={1.7}
                className="text-gold"
              />

              <span className="text-[11px] font-medium text-gold/80">
                {isArabic
                  ? "فرص جديدة"
                  : "NEW OPPORTUNITIES"}
              </span>
            </div>

            <h2 className="mt-2 max-w-[16rem] text-[1.55rem] font-semibold leading-[1.22] text-white">
              {isArabic
                ? "ابدأ خطوتك التالية"
                : "Take your next step"}
            </h2>

            <p className="mt-2 max-w-[18rem] text-[13px] leading-6 text-white/38">
              {isArabic
                ? "اكتشف فرص الكاست والمشاريع الجديدة من جهات تبحث عن المواهب المناسبة."
                : "Discover casting calls and projects from organizations looking for the right talent."}
            </p>
          </div>

          <Link
            href={`/${locale}/opportunities`}
            className="mt-7 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 text-xs text-white/45 transition active:scale-[0.98] active:border-gold/20 active:text-gold"
          >
            <span>
              {isArabic ? "عرض الكل" : "View all"}
            </span>

            <DirectionArrow size={13} />
          </Link>
        </div>

        {/* Editorial divider */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <div className="h-px w-12 bg-gold/35" />
        </div>
      </div>

      {/* Opportunities content */}
      <div className="relative mt-5">
        <MobileOpportunitiesList
          locale={locale}
        />
      </div>
    </section>
  );
}