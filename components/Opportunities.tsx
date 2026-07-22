import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import {
  ArrowUpRight,
  Building2,
  MapPin,
  BriefcaseBusiness,
} from "lucide-react";

export function Opportunities({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const title =
    locale === "ar" ? "الفرص المفتوحة" : "Open Opportunities";

  const subtitle =
    locale === "ar"
      ? "فرص casting حقيقية من جهات إنتاج، علامات تجارية، ووكالات"
      : "Real casting opportunities from agencies, brands, and production houses";

  const data = [
    {
      title: locale === "ar" ? "إعلان تجاري" : "Commercial Campaign",
      company: "Production House",
      location: locale === "ar" ? "الرياض" : "Riyadh",
      type: locale === "ar" ? "كاستينج" : "Casting",
    },
    {
      title: locale === "ar" ? "فيلم قصير" : "Short Film",
      company: "Film Studio",
      location: locale === "ar" ? "جدة" : "Jeddah",
      type: locale === "ar" ? "تمثيل" : "Acting",
    },
    {
      title: locale === "ar" ? "حملة أزياء" : "Fashion Campaign",
      company: "Brand Agency",
      location: locale === "ar" ? "الرياض" : "Riyadh",
      type: locale === "ar" ? "مودل" : "Modeling",
    },
  ];

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
            <p className="arabic-safe mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
              {locale === "ar"
                ? "فرص ملامح"
                : "MLAMH Opportunities"}
            </p>

            <h2 className="text-4xl font-light text-white md:text-6xl">
              {title}
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/60">
              {subtitle}
            </p>
          </div>

          <Link
            href={`/${locale}/opportunities`}
            className="arabic-safe inline-flex w-fit items-center gap-3 rounded-full border border-gold/30 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-gold transition hover:bg-gold hover:text-black"
          >
            {locale === "ar"
              ? "عرض جميع الفرص"
              : "View All Opportunities"}

              <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_0_50px_rgba(201,164,93,0.10)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 transition group-hover:opacity-100" />

              {/* Tag */}
              <div className="arabic-safe inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-gold">
    <BriefcaseBusiness size={12} />
    {item.type}
</div>

              {/* Title */}
              <h3 className="mt-6 text-2xl font-light text-white transition group-hover:text-gold">
                {item.title}
              </h3>

              {/* Details */}
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/40">
    <Building2 size={14}/>
    {locale==="ar" ? "الجهة" : "Company"}
</span>

                  <span className="text-white/80">
                    {item.company}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/40">
    <MapPin size={14}/>
    {locale==="ar" ? "المدينة" : "City"}
</span>

                  <span className="text-white/80">
                    {item.location}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/${locale}/opportunities`}
                className="mt-8 flex items-center justify-between border-t border-white/10 pt-5"
              >
                <span className="text-sm text-white/45 transition group-hover:text-white">
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
          ))}
        </div>
      </div>
    </section>
  );
}