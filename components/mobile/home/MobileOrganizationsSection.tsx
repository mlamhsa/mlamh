import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clapperboard,
  Sparkles,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";

export function MobileOrganizationsSection({
  locale,
}: {
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const organizations = [
    {
      key: "agencies",
      title: isArabic ? "وكالات الإعلان" : "Ad agencies",
      subtitle: isArabic ? "إعلان وإبداع" : "Advertising & creative",
      icon: Sparkles,
    },
    {
      key: "production",
      title: isArabic ? "شركات الإنتاج" : "Production companies",
      subtitle: isArabic ? "إنتاج مرئي" : "Film & production",
      icon: Clapperboard,
    },
    {
      key: "casting",
      title: isArabic ? "مديرو الكاست" : "Casting directors",
      subtitle: isArabic ? "اختيار المواهب" : "Talent casting",
      icon: BriefcaseBusiness,
    },
    {
      key: "brands",
      title: isArabic ? "العلامات التجارية" : "Brands",
      subtitle: isArabic ? "مشاريع تجارية" : "Commercial projects",
      icon: Building2,
    },
  ];

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden px-4 pb-10 pt-3"
    >
      {/* Ambient layer */}
      <div className="pointer-events-none absolute -end-28 top-8 h-64 w-64 rounded-full bg-gold/[0.03] blur-[100px]" />

      {/* Section header */}
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Building2
                size={14}
                strokeWidth={1.7}
                className="text-gold"
              />

              <span className="text-[11px] font-medium text-gold/80">
                {isArabic
                  ? "صنّاع الفرص"
                  : "INDUSTRY"}
              </span>
            </div>

            <h2 className="mt-2 max-w-[16rem] text-[1.55rem] font-semibold leading-[1.22] text-white">
              {isArabic
                ? "اكتشف الجهات"
                : "Discover organizations"}
            </h2>

            <p className="mt-2 max-w-[18rem] text-[13px] leading-6 text-white/38">
              {isArabic
                ? "تعرّف على الوكالات وشركات الإنتاج والجهات التي تبحث عن المواهب."
                : "Explore agencies, production companies, and organizations looking for talent."}
            </p>
          </div>

          <Link
            href={`/${locale}/publishers`}
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

      {/* Organization categories */}
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        {organizations.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={`/${locale}/publishers`}
              className="group relative min-h-[158px] overflow-hidden rounded-[1.55rem] border border-white/[0.08] bg-white/[0.025] p-4 transition active:scale-[0.985] active:border-gold/20 active:bg-white/[0.045]"
            >
              <div className="pointer-events-none absolute -end-10 -top-12 h-28 w-28 rounded-full bg-gold/[0.035] blur-3xl" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Icon
                    size={24}
                    strokeWidth={1.6}
                    className="text-gold/85"
                  />

                  <DirectionArrow
                    size={15}
                    className="text-white/20 transition group-active:text-gold"
                  />
                </div>

                <div className="mt-auto pt-6">
                  <p className="text-[10px] text-white/30">
                    {item.subtitle}
                  </p>

                  <h3 className="mt-1 text-[16px] font-semibold leading-6 text-white">
                    {item.title}
                  </h3>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}