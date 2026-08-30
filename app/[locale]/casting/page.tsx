import type { Metadata } from "next";

import { CastingRequestForm } from "@/components/casting/CastingRequestForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale !== "en";

  return {
    title: isArabic ? "MLAMH Casting | إدارة الكاستينغ" : "MLAMH Casting | Managed Casting",
    description: isArabic
      ? "خدمة احترافية للجهات لإدارة احتياج الممثلين والمودلز من الـ Brief حتى الوصول إلى قائمة مرشحين منظمة."
      : "A managed casting service for companies, from brief intake to organized actor and model shortlists.",
  };
}

export default async function CastingPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale: rawLocale = "ar" } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";

  const steps = isRtl
    ? [
        ["01", "أرسل الـ Brief", "أرسل لنا احتياج المشروع والمتطلبات الأساسية بدل البدء من عشرات الرسائل والملفات."],
        ["02", "نراجع وننظم", "يراجع فريق ملامح نطاق المشروع ويحوّل الاحتياج إلى عملية Casting منظمة."],
        ["03", "نستقبل ونفرز", "تُجمع الطلبات داخل ملامح وننظم مرحلة الفرز والوصول إلى المرشحين المناسبين."],
        ["04", "Shortlist للقرار", "تحصل الجهة على قائمة مختصرة واضحة تساعدها على اتخاذ قرار الكاستينغ."],
      ]
    : [
        ["01", "Send the brief", "Tell us what the project needs without starting with scattered messages and files."],
        ["02", "We structure it", "MLAMH reviews the scope and turns the brief into an organized casting workflow."],
        ["03", "Applications & screening", "Applications are collected through MLAMH and screened into a clearer candidate pool."],
        ["04", "Shortlist for decision", "Your team receives an organized shortlist to support the final casting decision."],
      ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-5 pb-24 pt-28 text-white sm:px-8 lg:px-10 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CASTING</p>
              <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] text-gold">
                {isRtl ? "Managed Casting" : "Managed Casting"}
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-light leading-tight sm:text-5xl lg:text-7xl">
              {isRtl
                ? "من الـ Brief إلى قائمة المرشحين."
                : "From brief to shortlist."}
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "MLAMH Casting خدمة مخصصة للشركات وجهات الإنتاج والوكالات والعلامات التي تريد إدارة احتياج الممثلين والمودلز بشكل أكثر تنظيمًا. نساعد في تجهيز العملية، جمع الطلبات، والفرز وصولًا إلى Shortlist قابلة للمراجعة."
                : "MLAMH Casting is a managed service for companies, production teams, agencies, and brands that need a more organized way to source actors and models. We help structure the casting, collect applications, screen candidates, and prepare a review-ready shortlist."}
            </p>

            <a
              href="#casting-brief"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
            >
              {isRtl ? "أرسل الـ Brief" : "Send a casting brief"}
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(([number, title, description]) => (
            <article key={number} className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6">
              <span className="text-sm text-gold">{number}</span>
              <h2 className="mt-4 text-xl font-light">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/50">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {[
            {
              name: "Starter",
              price: isRtl ? "990 ريال" : "SAR 990",
              ar: "إعداد الفرصة، تنظيم الطلبات، وShortlist حتى 10 مرشحين.",
              en: "Opportunity setup, organized applications, and a shortlist of up to 10 candidates.",
            },
            {
              name: "Pro",
              price: isRtl ? "2,490 ريال" : "SAR 2,490",
              ar: "بحث نشط، دعوة مواهب مناسبة، Screening وShortlist حتى 20 مرشحًا.",
              en: "Active talent search, targeted invitations, screening, and up to 20 shortlisted candidates.",
            },
            {
              name: "Custom",
              price: isRtl ? "يبدأ من 4,900 ريال" : "From SAR 4,900",
              ar: "للمشاريع متعددة الأدوار أو الحملات والأعداد الكبيرة ونطاقات العمل الخاصة.",
              en: "For multi-role projects, campaigns, larger volumes, and custom casting scopes.",
            },
          ].map((item, index) => (
            <article
              key={item.name}
              className={`rounded-[2rem] border p-6 sm:p-8 ${
                index === 1 ? "border-gold/30 bg-gold/[0.05]" : "border-white/10 bg-white/[0.025]"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-gold">{item.name}</p>
              <p className="mt-4 text-3xl font-light">{item.price}</p>
              <p className="mt-4 text-sm leading-8 text-white/55">{isRtl ? item.ar : item.en}</p>
            </article>
          ))}
        </section>

        <section id="casting-brief" className="mt-8 scroll-mt-28 rounded-[2.25rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8 lg:p-10">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">
              {isRtl ? "ابدأ المشروع" : "Start a project"}
            </p>
            <h2 className="mt-4 text-3xl font-light sm:text-4xl">
              {isRtl ? "أرسل احتياج الكاستينغ" : "Send your casting brief"}
            </h2>
            <p className="mt-4 text-sm leading-8 text-white/50">
              {isRtl
                ? "لا تحتاج إلى تجهيز إعلان كامل. أرسل ما تعرفه الآن، وسنراجع النطاق قبل أي التزام أو نشر."
                : "You do not need a finished casting notice. Send what you know now and we will review the scope before any commitment or publication."}
            </p>
          </div>

          <CastingRequestForm locale={locale} />
        </section>
      </div>
    </main>
  );
}
