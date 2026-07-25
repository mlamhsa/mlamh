import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import {
  ArrowUpRight,
  Building2,
  MapPin,
  BriefcaseBusiness,
} from "lucide-react";

export async function Opportunities({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";
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
  const title =
    locale === "ar" ? "الفرص المفتوحة" : "Open Opportunities";

  const subtitle =
    locale === "ar"
      ? "فرص casting حقيقية من جهات إنتاج، علامات تجارية، ووكالات"
      : "Real casting opportunities from agencies, brands, and production houses";

  const data = (await getPublishedOpportunities()).slice(0, 6);

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/10 bg-black py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p
              className={[
                "mb-4 text-[10px] text-gold",
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.4em]",
              ].join(" ")}
            >
              {locale === "ar"
                ? "فرص ملامح"
                : "MLAMH Opportunities"}
            </p>

            <h2 className="text-4xl font-light tracking-normal text-white md:text-6xl">
              {title}
            </h2>

            <p className="mt-6 text-lg leading-8 tracking-normal text-white/60">
              {subtitle}
            </p>
          </div>

          <Link
            href={`/${locale}/opportunities`}
            className={[
              "inline-flex w-fit items-center gap-3 rounded-full border border-gold/30 bg-gold/[0.06] px-6 py-3 text-[10px] text-gold transition hover:bg-gold hover:text-black",
              isRtl
                ? "tracking-normal"
                : "uppercase tracking-[0.28em]",
            ].join(" ")}
          >
            {locale === "ar"
              ? "عرض جميع الفرص"
              : "View All Opportunities"}

            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        {data.length === 0 ? (
          <div className="rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-10 text-center">
            <BriefcaseBusiness
              size={30}
              className="mx-auto text-gold"
            />

            <h3 className="mt-5 text-2xl font-light tracking-normal text-white">
              {locale === "ar"
                ? "لا توجد فرص منشورة حاليًا"
                : "No published opportunities yet"}
            </h3>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 tracking-normal text-white/50">
              {locale === "ar"
                ? "تابع المنصة، سيتم نشر فرص جديدة قريبًا."
                : "Check back soon for new opportunities."}
            </p>

            <Link
              href={`/${locale}/opportunities`}
              className={[
                "mt-7 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/[0.06] px-6 py-3 text-[10px] text-gold transition hover:bg-gold hover:text-black",
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.28em]",
              ].join(" ")}
            >
              {locale === "ar"
                ? "زيارة صفحة الفرص"
                : "Browse Opportunities"}

              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => {
              const location =
                locale === "ar"
                  ? item.city_ar ?? item.city_en ?? "-"
                  : item.city_en ?? item.city_ar ?? "-";

              return (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_50px_rgba(201,164,93,0.10)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition group-hover:opacity-100" />

                  {/* Tag */}
                  <div
  className={[
    "inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] text-gold",
    isRtl
      ? "tracking-normal"
      : "uppercase tracking-[0.22em]",
  ].join(" ")}
>
  <BriefcaseBusiness size={12} />

  {
    opportunityTypeLabels[item.opportunity_type]?.[
      locale === "ar" ? "ar" : "en"
    ] ?? item.opportunity_type
  }
</div>

                  {/* Title */}
                  <h3 className="mt-6 text-2xl font-light tracking-normal text-white transition group-hover:text-gold">
                    {item.title}
                  </h3>

                  {/* Details */}
                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex shrink-0 items-center gap-2 tracking-normal text-white/40">
                        <Building2 size={14} />
                        {locale === "ar" ? "الجهة" : "Company"}
                      </span>

                      <span className="min-w-0 truncate tracking-normal text-white/80">
                        {item.company_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex shrink-0 items-center gap-2 tracking-normal text-white/40">
                        <MapPin size={14} />
                        {locale === "ar" ? "المدينة" : "City"}
                      </span>

                      <span className="min-w-0 truncate tracking-normal text-white/80">
                        {location}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/${locale}/opportunities/${item.slug}`}
                    className="mt-8 flex items-center justify-between border-t border-white/10 pt-5"
                  >
                    <span className="text-sm tracking-normal text-white/45 transition group-hover:text-white">
                      {locale === "ar"
                        ? "عرض تفاصيل الفرصة"
                        : "View Opportunity"}
                    </span>

                    <ArrowUpRight
                      size={18}
                      className="text-gold transition group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}