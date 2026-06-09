import type { Dictionary, Locale } from "@/lib/i18n";

export function HowItWorks({
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const isAr = locale === "ar";

  const steps = isAr
    ? [
        {
          number: "01",
          title: "أنشئ ملفك",
          description:
            "ابنِ ملف موهبة احترافي يعرض صورك، تخصصك، مدينتك، وروابطك المهمة.",
        },
        {
          number: "02",
          title: "احصل على الظهور",
          description:
            "يظهر ملفك أمام الوكالات، شركات الإنتاج، ومديري الكاست في السوق السعودي.",
        },
        {
          number: "03",
          title: "استقبل الفرص",
          description:
            "استقبل طلبات كاست مباشرة وتواصل مع الجهات المهتمة بموهبتك.",
        },
      ]
    : [
        {
          number: "01",
          title: "Create Your Profile",
          description:
            "Build a professional talent profile with your photos, category, city, and key links.",
        },
        {
          number: "02",
          title: "Get Discovered",
          description:
            "Appear in front of agencies, production companies, and casting teams in Saudi Arabia.",
        },
        {
          number: "03",
          title: "Receive Opportunities",
          description:
            "Receive direct casting requests and connect with teams interested in your talent.",
        },
      ];

  return (
    <section className="border-y border-white/[0.06] bg-background px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-gold">
            {isAr ? "كيف تعمل ملامح" : "How MLAMH Works"}
          </p>

          <h2
            className="text-4xl font-light tracking-tight md:text-6xl"
            style={{ fontFamily: isAr ? "var(--font-noto-arabic)" : "var(--font-cormorant)" }}
          >
            {isAr
              ? "من ملف احترافي إلى فرصة كاست"
              : "From profile to casting opportunity"}
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-[32px] border border-white/[0.08] bg-white/[0.025] p-7 transition hover:border-gold/25"
            >
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                {step.number}
              </p>

              <h3
                className="mt-10 text-3xl font-light text-white"
                style={{ fontFamily: isAr ? "var(--font-noto-arabic)" : "var(--font-cormorant)" }}
              >
                {step.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-muted">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}