import type { Locale } from "@/lib/i18n";

export function HowItWorks({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const title =
    locale === "ar" ? "كيف تعمل ملامح؟" : "How MALAMIH Works";

  const steps =
    locale === "ar"
      ? [
          {
            title: "إنشاء ملف",
            desc: "الموهبة تنشئ ملف احترافي يحتوي الصور والمعلومات الأساسية",
          },
          {
            title: "التحليل والمطابقة",
            desc: "النظام يربطك بالفرص المناسبة حسب الشكل والمهارات",
          },
          {
            title: "اختيار من الجهات",
            desc: "شركات الإنتاج والوكالات تختار المواهب مباشرة",
          },
          {
            title: "تنفيذ المشروع",
            desc: "تتم عملية التعاقد والتنفيذ بشكل سريع واحترافي",
          },
        ]
      : [
          {
            title: "Create Profile",
            desc: "Talent creates a professional profile with media and details",
          },
          {
            title: "Smart Matching",
            desc: "System matches talent with suitable casting opportunities",
          },
          {
            title: "Agency Selection",
            desc: "Agencies and production houses select directly",
          },
          {
            title: "Project Execution",
            desc: "Contracts and execution happen seamlessly inside the platform",
          },
        ];

  return (
    <section className="relative py-28 bg-black border-t border-white/10">

      <div className="mx-auto max-w-7xl px-6">

        {/* Title */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-[-0.02em]">
            {title}
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-4 gap-8">

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur"
            >

              {/* Step number */}
              <div className="text-gold text-xs tracking-[0.3em] mb-4">
                {locale === "ar"
                  ? `٠${index + 1}`
                  : `0${index + 1}`}
              </div>

              {/* Title */}
              <h3 className="text-white text-lg font-medium mb-3">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-white/60 text-sm leading-6">
                {step.desc}
              </p>

              {/* connector line */}
              {index !== steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-[-20px] w-10 h-px bg-white/10" />
              )}

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}