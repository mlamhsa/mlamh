import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Wallet,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";

function formatCompensation(
  compensationType: string | null | undefined,
  budget: string | number | null | undefined,
  isArabic: boolean,
) {
  if (compensationType === "unpaid") {
    return isArabic ? "غير مدفوع" : "Unpaid";
  }

  if (compensationType === "negotiable") {
    return isArabic ? "حسب الاتفاق" : "Negotiable";
  }

  const amount = Number(budget);

  if (!Number.isFinite(amount) || amount <= 0) {
    return isArabic ? "غير محدد" : "Not specified";
  }

  return `${new Intl.NumberFormat(
    isArabic ? "ar-SA-u-nu-latn" : "en-US",
  ).format(amount)} ${isArabic ? "ريال" : "SAR"}`;
}

export async function MobileOpportunitiesList({
  locale,
}: {
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const opportunityTypeLabels: Record<
    string,
    { ar: string; en: string }
  > = {
    actor: {
      ar: "ممثل",
      en: "Actor",
    },
    actress: {
      ar: "ممثلة",
      en: "Actress",
    },
    model: {
      ar: "مودل",
      en: "Model",
    },
    makeup_artist: {
      ar: "خبير مكياج",
      en: "Makeup Artist",
    },
    photographer: {
      ar: "مصور",
      en: "Photographer",
    },
    influencer: {
      ar: "صانع محتوى",
      en: "Influencer",
    },
    presenter: {
      ar: "مقدم",
      en: "Presenter",
    },
  };

  const opportunities = (
    await getPublishedOpportunities()
  ).slice(0, 4);

  if (opportunities.length === 0) {
    return (
      <div className="px-4">
        <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] px-5 py-8 text-center">
          <BriefcaseBusiness
            size={25}
            strokeWidth={1.5}
            className="mx-auto text-gold/70"
          />

          <h3 className="mt-4 text-base font-medium text-white">
            {isArabic
              ? "لا توجد فرص منشورة حاليًا"
              : "No opportunities yet"}
          </h3>

          <p className="mx-auto mt-2 max-w-[17rem] text-xs leading-6 text-white/35">
            {isArabic
              ? "سيتم نشر فرص جديدة هنا فور توفرها."
              : "New opportunities will appear here as soon as they're available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="relative"
    >
      <div className="space-y-3 px-4">
        {opportunities.map((item, index) => {
          const location =
            isArabic
              ? item.city_ar ?? item.city_en ?? "-"
              : item.city_en ?? item.city_ar ?? "-";

          const compensation = formatCompensation(
            item.compensation_type,
            item.budget,
            isArabic,
          );

          const opportunityType =
            opportunityTypeLabels[item.opportunity_type]?.[
              isArabic ? "ar" : "en"
            ] ?? item.opportunity_type;

          const href =
            `/${locale}/opportunities/${item.slug}`;

          return (
            <Link
              key={item.id}
              href={href}
              className={[
                "group relative block overflow-hidden rounded-[1.55rem] border p-4 transition active:scale-[0.99]",
                index === 0
                  ? "border-gold/20 bg-gradient-to-br from-gold/[0.075] via-white/[0.035] to-white/[0.02]"
                  : "border-white/[0.08] bg-white/[0.025]",
              ].join(" ")}
            >
              {index === 0 && (
                <div className="pointer-events-none absolute -end-16 -top-20 h-40 w-40 rounded-full bg-gold/[0.06] blur-3xl" />
              )}

              <div className="relative">
                {/* Tags */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.07] px-2.5 py-1 text-[10px] font-medium text-gold">
                      <BriefcaseBusiness
                        size={11}
                        strokeWidth={1.7}
                      />

                      {isArabic ? "فرصة" : "Opportunity"}
                    </span>

                    <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[10px] text-white/45">
                      {opportunityType}
                    </span>
                  </div>

                  {index === 0 && (
                    <span className="shrink-0 text-[9px] font-medium text-gold/65">
                      {isArabic
                        ? "الأحدث"
                        : "LATEST"}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="mt-4 line-clamp-2 text-[17px] font-semibold leading-7 text-white">
                  {item.title}
                </h3>

                {/* Company */}
                <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-white/45">
                  <Building2
                    size={13}
                    strokeWidth={1.6}
                    className="shrink-0 text-gold/65"
                  />

                  <span className="truncate">
                    {item.company_name}
                  </span>
                </div>

                {/* Metadata */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="min-w-0 rounded-[1rem] border border-white/[0.06] bg-black/15 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                      <MapPin
                        size={11}
                        strokeWidth={1.6}
                        className="text-gold/60"
                      />

                      <span>
                        {isArabic ? "الموقع" : "Location"}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-medium text-white/65">
                      {location}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-[1rem] border border-white/[0.06] bg-black/15 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                      <Wallet
                        size={11}
                        strokeWidth={1.6}
                        className="text-gold/60"
                      />

                      <span>
                        {isArabic ? "المقابل" : "Compensation"}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-medium text-white/65">
                      {compensation}
                    </p>
                  </div>
                </div>

                {/* Open */}
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-[11px] text-white/35">
                    {isArabic
                      ? "عرض تفاصيل الفرصة"
                      : "View opportunity"}
                  </span>

                  <DirectionArrow
                    size={16}
                    strokeWidth={1.6}
                    className="text-gold transition-transform group-active:-translate-x-1"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}