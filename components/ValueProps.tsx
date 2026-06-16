import type { Locale } from "@/lib/i18n";

export function ValueProps({
  locale,
}: {
  locale: Locale;
}) {
  const title =
    locale === "ar"
      ? "منصة تربط الطرفين بشكل مباشر"
      : "A Platform Connecting Both Sides";

  const subtitle =
    locale === "ar"
      ? "نحوّل عملية اختيار المواهب إلى نظام سريع، دقيق، وقابل للتوسع"
      : "We turn casting into a fast, precise and scalable system";

  const talentTitle = locale === "ar" ? "للمواهب" : "For Talent";
  const agencyTitle = locale === "ar" ? "للجهات" : "For Agencies";

  const talents =
    locale === "ar"
      ? [
          "ملف احترافي يعرضك بشكل صحيح",
          "فرص حقيقية بدون وسطاء",
          "زيادة فرص الظهور",
          "متابعة الطلبات بسهولة",
        ]
      : [
          "Professional profile presentation",
          "Direct access to opportunities",
          "Higher visibility",
          "Track applications easily",
        ];

  const agencies =
    locale === "ar"
      ? [
          "الوصول إلى قاعدة مواهب جاهزة",
          "تقليل وقت الاختيار",
          "فلترة دقيقة وسريعة",
          "إدارة الكاست بسهولة",
        ]
      : [
          "Access ready talent database",
          "Reduce casting time",
          "Advanced filtering system",
          "Easy casting management",
        ];

  return (
    <section className="relative py-28 bg-black border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-white text-4xl md:text-5xl font-light tracking-[-0.02em]">
            {title}
          </h2>

          <p className="mt-4 text-white/60 text-lg">
            {subtitle}
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8">

          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
            <h3 className="text-gold text-sm uppercase tracking-[0.3em] mb-6">
              {talentTitle}
            </h3>

            <ul className="space-y-4">
              {talents.map((item, i) => (
                <li key={i} className="text-white/80 flex gap-3">
                  <span className="text-gold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
            <h3 className="text-gold text-sm uppercase tracking-[0.3em] mb-6">
              {agencyTitle}
            </h3>

            <ul className="space-y-4">
              {agencies.map((item, i) => (
                <li key={i} className="text-white/80 flex gap-3">
                  <span className="text-gold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}