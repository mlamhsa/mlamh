import type { Locale } from "@/lib/i18n";
import Link from "next/link";

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
    <section className="relative py-28 bg-black border-t border-white/10">

      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl text-white font-light">
            {title}
          </h2>

          <p className="mt-4 text-white/60 text-lg">
            {subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-8">

          {data.map((item, i) => (
            <div
              key={i}
              className="group rounded-3xl border border-white/10 bg-white/5 p-6 hover:border-gold/30 transition"
            >

              {/* Tag */}
              <div className="text-gold text-[10px] uppercase tracking-[0.3em] mb-4">
                {item.type}
              </div>

              {/* Title */}
              <h3 className="text-white text-xl font-light">
                {item.title}
              </h3>

              {/* Company */}
              <p className="text-white/60 mt-2 text-sm">
                {item.company}
              </p>

              {/* Location */}
              <p className="text-white/40 mt-1 text-sm">
                {item.location}
              </p>

              {/* CTA */}
              <Link
                href={`/${locale}/apply`}
                className="inline-block mt-6 text-sm text-gold hover:underline"
              >
                {locale === "ar" ? "تقديم على الفرصة" : "Apply Now"}
              </Link>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}