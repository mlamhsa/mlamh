import type { Locale } from "@/lib/i18n";

export function BusinessModel({
  locale,
}: {
  locale: Locale;
}) {
  const title =
    locale === "ar" ? "نموذج العمل" : "Business Model";

  const subtitle =
    locale === "ar"
      ? "منصة ملامح تعتمد على اشتراكات وخدمات مدفوعة"
      : "MALAMIH operates on subscriptions and premium services";

  const items = [
    {
      title: locale === "ar" ? "اشتراكات الشركات" : "Agency Subscriptions",
      desc:
        locale === "ar"
          ? "وصول كامل إلى قاعدة المواهب وإدارة الفرص"
          : "Full access to talent database and casting tools",
    },
    {
      title: locale === "ar" ? "إبراز الفرص" : "Featured Listings",
      desc:
        locale === "ar"
          ? "ترقية الفرص لزيادة الظهور"
          : "Boost listings for higher visibility",
    },
    {
      title: locale === "ar" ? "توثيق المواهب" : "Talent Verification",
      desc:
        locale === "ar"
          ? "رسوم تحقق الهوية والمعلومات"
          : "Paid identity verification system",
    },
    {
      title: locale === "ar" ? "العضوية المميزة" : "Premium Talent",
      desc:
        locale === "ar"
          ? "ترقية الملف لزيادة فرص الظهور"
          : "Upgrade profile for better exposure",
    },
  ];

  return (
    <section className="py-28 bg-black border-t border-white/10">

      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center max-w-2xl mx-auto mb-16">

          <h2 className="text-4xl md:text-5xl text-white font-light">
            {title}
          </h2>

          <p className="mt-4 text-white/60 text-lg">
            {subtitle}
          </p>

        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {items.map((item, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl border border-white/10 bg-white/5"
            >
              <h3 className="text-white text-xl font-light">
                {item.title}
              </h3>

              <p className="mt-3 text-white/60 text-sm leading-6">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}