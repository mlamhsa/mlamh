import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  UsersRound,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";

type MobileQuickAccessProps = {
  locale: Locale;
};

export function MobileQuickAccess({
  locale,
}: MobileQuickAccessProps) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const items = [
    {
      key: "talents",
      eyebrow: isArabic ? "اكتشف" : "DISCOVER",
      title: isArabic ? "استكشف المواهب" : "Explore talents",
      description: isArabic
        ? "اكتشف الوجوه والخبرات المناسبة لمشروعك."
        : "Discover the right faces and expertise for your project.",
      href: `/${locale}/talent`,
      icon: UsersRound,
    },
    {
      key: "opportunities",
      eyebrow: isArabic ? "تقدّم" : "APPLY",
      title: isArabic ? "تصفح الفرص" : "Browse opportunities",
      description: isArabic
        ? "اعثر على فرص جديدة تناسب ملفك وطموحك."
        : "Find new opportunities that match your profile and ambition.",
      href: `/${locale}/opportunities`,
      icon: BriefcaseBusiness,
    },
    {
      key: "organizations",
      eyebrow: isArabic ? "تواصل" : "CONNECT",
      title: isArabic ? "اكتشف الجهات" : "Explore organizations",
      description: isArabic
        ? "وكالات وشركات إنتاج وجهات تبحث عن مواهب."
        : "Agencies, production companies, and organizations seeking talent.",
      href: `/${locale}/publishers`,
      icon: Building2,
    },
  ];

  return (
    <section className="px-4 pb-10 pt-1">
      {/* Section heading */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-gold/80">
            {isArabic ? "وصول سريع" : "QUICK ACCESS"}
          </p>

          <h2 className="mt-1.5 text-[1.7rem] font-semibold leading-tight text-white">
            {isArabic ? "ابدأ من هنا" : "Start here"}
          </h2>
        </div>

        <span className="pb-1 text-[10px] tracking-[0.16em] text-white/20">
          MLAMH
        </span>
      </div>

      {/* Main discovery card */}
      <Link
        href={items[0].href}
        className="group relative block overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.065] via-white/[0.03] to-transparent p-5 shadow-[0_22px_60px_rgba(0,0,0,0.24)] transition active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute -end-12 -top-16 h-40 w-40 rounded-full bg-gold/[0.08] blur-3xl" />

        <div className="relative flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-gold/20 bg-gold/[0.08] text-gold">
            <UsersRound size={25} strokeWidth={1.7} />
          </span>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-medium text-gold/65">
              {items[0].eyebrow}
            </span>

            <h3 className="mt-1 text-[1.15rem] font-semibold text-white">
              {items[0].title}
            </h3>

            <p className="mt-2 max-w-[17rem] text-[13px] leading-6 text-white/40">
              {items[0].description}
            </p>
          </div>

          <DirectionArrow
            size={18}
            className="mt-1 shrink-0 text-white/25 transition-transform group-active:-translate-x-1"
          />
        </div>
      </Link>

      {/* Secondary actions */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.slice(1).map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              className="group relative min-h-[172px] overflow-hidden rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-4 transition active:scale-[0.985] active:bg-white/[0.045]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/[0.08] bg-white/[0.035] text-gold/85">
                    <Icon size={21} strokeWidth={1.7} />
                  </span>

                  <DirectionArrow
                    size={16}
                    className="mt-2 text-white/20"
                  />
                </div>

                <div className="mt-auto pt-5">
                  <span className="text-[9px] font-medium text-gold/60">
                    {item.eyebrow}
                  </span>

                  <h3 className="mt-1 text-[15px] font-semibold leading-6 text-white">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-white/35">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}