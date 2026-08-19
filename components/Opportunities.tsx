import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import {
  ArrowUpRight,
  Building2,
  MapPin,
  BriefcaseBusiness,
  Wallet,
} from "lucide-react";

function formatCompensation(
  compensationType: string | null | undefined,
  budget: string | number | null | undefined,
  isRtl: boolean,
) {
  if (compensationType === "unpaid") {
    return isRtl ? "غير مدفوع" : "Unpaid";
  }

  if (compensationType === "negotiable") {
    return isRtl ? "حسب الاتفاق" : "Negotiable";
  }

  const amount = Number(budget);

  if (!Number.isFinite(amount) || amount <= 0) {
    return isRtl ? "غير محدد" : "Not specified";
  }

  return `${new Intl.NumberFormat(
    isRtl ? "ar-SA-u-nu-latn" : "en-US",
  ).format(amount)} ${isRtl ? "ريال" : "SAR"}`;
}

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
      ? "فرص كاستينغ حقيقية من شركات إنتاج وعلامات تجارية ووكالات"
      : "Real casting opportunities from agencies, brands, and production houses";

  const data = (await getPublishedOpportunities()).slice(0, 6);
  const mobileData = data.slice(0, 3);

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden bg-black pb-4 lg:border-t lg:border-white/10 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        {/* Header — desktop only. Mobile already has its own heading in app/[locale]/page.tsx */}
        <div className="mb-16 hidden flex-col gap-8 lg:flex lg:flex-row lg:items-end lg:justify-between">
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
          <>
            <div className="grid gap-3 lg:hidden">
  {mobileData.map((item) => {
    const location =
      locale === "ar"
        ? item.city_ar ?? item.city_en ?? "-"
        : item.city_en ?? item.city_ar ?? "-";

    const compensation = formatCompensation(
      item.compensation_type,
      item.budget,
      isRtl,
    );

    const opportunityType =
      opportunityTypeLabels[item.opportunity_type]?.[
        locale === "ar" ? "ar" : "en"
      ] ?? item.opportunity_type;

    const opportunityHref = `/${locale}/opportunities/${item.slug}`;

    return (
      <Link
        key={item.id}
        href={opportunityHref}
        className="group relative block overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-white/[0.035] p-4 transition active:scale-[0.99] active:bg-white/[0.06]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] text-gold">
                <BriefcaseBusiness size={11} />
                {locale === "ar" ? "فرصة" : "Opportunity"}
              </span>

              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/50">
                {opportunityType}
              </span>
            </div>

            <h3 className="mt-4 line-clamp-2 text-lg font-medium leading-7 text-white">
              {item.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/45">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Building2 size={13} className="shrink-0 text-gold/70" />
                <span className="max-w-[140px] truncate">
                  {item.company_name}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0 text-gold/70" />
                {location}
              </span>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-gold">
            <ArrowUpRight size={15} />
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3 text-xs">
          <Wallet size={13} className="text-gold" />

          <span className="text-white/40">
            {locale === "ar" ? "المقابل" : "Compensation"}
          </span>

          <span className="font-medium text-white/75">
            {compensation}
          </span>
        </div>
      </Link>
    );
  })}
</div>
          <div className="hidden gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => {
              const location =
                locale === "ar"
                  ? item.city_ar ?? item.city_en ?? "-"
                  : item.city_en ?? item.city_ar ?? "-";

              const compensation = formatCompensation(
                item.compensation_type,
                item.budget,
                isRtl,
              );

              const opportunityType =
                opportunityTypeLabels[item.opportunity_type]?.[
                  locale === "ar" ? "ar" : "en"
                ] ?? item.opportunity_type;

              const opportunityHref = `/${locale}/opportunities/${item.slug}`;

              return (
                <Link
                  key={item.id}
                  href={opportunityHref}
                  className="group relative block overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_50px_rgba(201,164,93,0.10)]"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition group-hover:opacity-100" />

                  {/* Tag */}
                  <div className="flex flex-wrap items-center gap-2">
  <div
    className={[
      "inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] text-gold",
      isRtl
        ? "tracking-normal"
        : "uppercase tracking-[0.22em]",
    ].join(" ")}
  >
    <BriefcaseBusiness size={12} />

    {locale === "ar"
      ? "فرصة"
      : "Opportunity"}
  </div>

  <div
    className={[
      "inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/55",
      isRtl
        ? "tracking-normal"
        : "uppercase tracking-[0.18em]",
    ].join(" ")}
  >
    {opportunityType}
  </div>
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

                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex shrink-0 items-center gap-2 tracking-normal text-white/40">
                        <Wallet size={14} />
                        {locale === "ar" ? "المقابل" : "Compensation"}
                      </span>

                      <span className="min-w-0 truncate tracking-normal text-white/80">
                        {compensation}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                    <span className="text-sm tracking-normal text-white/45 transition group-hover:text-white">
                      {locale === "ar"
                        ? "عرض تفاصيل الفرصة"
                        : "View Opportunity"}
                    </span>

                    <ArrowUpRight
                      size={18}
                      className="text-gold transition group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>
                </Link>
              );
            })}
                    </div>
        </>
        )}
      </div>
    </section>
  );
}
