import type { Metadata } from "next";

import { CastingRequestForm } from "@/components/casting/CastingRequestForm";

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale !== "en";
  return {
    title: isArabic ? "MLAMH Casting | إدارة الكاستينغ" : "MLAMH Casting | Managed Casting",
    description: isArabic
      ? "خدمة احترافية للجهات لإدارة احتياج الممثلين والمودلز من الـ Brief حتى الوصول إلى قائمة مرشحين منظمة."
      : "A managed casting service for companies, from brief intake to organized actor and model shortlists.",
  };
}

export default async function CastingPage({ params }: { params: Promise<{ locale?: string }> }) {
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

  const serviceScopes = isRtl
    ? [
        ["إدارة أساسية", "تجهيز نطاق الكاستينغ، تنظيم استقبال الطلبات، وإعداد قائمة مرشحين للمراجعة."],
        ["بحث وفرز متقدم", "بحث نشط ودعوات للمواهب المناسبة مع Screening وقائمة مختصرة منظمة."],
        ["مشاريع متعددة الأدوار", "إدارة حملات ومشاريع تحتوي على عدة Roles أو أعداد كبيرة ونطاق عمل مخصص."],
      ]
    : [
        ["Core management", "Casting setup, organized application intake, and a review-ready candidate shortlist."],
        ["Advanced sourcing & screening", "Active talent sourcing and targeted invitations with structured screening and shortlisting."],
        ["Multi-role projects", "Managed casting for campaigns, multiple roles, larger volumes, and custom scopes."],
      ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-5 pb-24 pt-28 text-white sm:px-8 lg:px-10 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CASTING</p>
              <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] text-gold">Managed Casting</span>
            </div>
            <h1 className="mt-6 text-4xl font-light leading-tight sm:text-5xl lg:text-7xl">
              {isRtl ? "من الـ Brief إلى قائمة المرشحين." : "From brief to shortlist."}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "MLAMH Casting خدمة مخصصة للشركات وجهات الإنتاج والوكالات والعلامات التي تريد إدارة احتياج الممثلين والمودلز بشكل أكثر تنظيمًا. نساعد في تجهيز العملية، جمع الطلبات، والفرز وصولًا إلى Shortlist قابلة للمراجعة."
                : "MLAMH Casting is a managed service for companies, production teams, agencies, and brands that need a more organized way to source actors and models. We help structure the casting, collect applications, screen candidates, and prepare a review-ready shortlist."}
            </p>
            <a href="#casting-brief" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110">
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

        <section className="mt-8 rounded-[2.25rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">{isRtl ? "نطاق الخدمة" : "SERVICE SCOPE"}</p>
              <h2 className="mt-4 text-3xl font-light">{isRtl ? "خدمة تتكيف مع حجم مشروعك" : "A service shaped around your project"}</h2>
              <p className="mt-4 text-sm leading-8 text-white/50">
                {isRtl
                  ? "نراجع كل Brief أولًا ثم نحدد نطاق العمل والعرض المناسب حسب عدد الأدوار، حجم البحث، ومتطلبات الفرز. لا يوجد التزام مالي بمجرد إرسال الطلب."
                  : "We review every brief first, then define the appropriate scope and quote based on roles, sourcing volume, and screening requirements. Sending a brief does not create a payment commitment."}
              </p>
            </div>
            <a href="#casting-brief" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10">
              {isRtl ? "اطلب عرضًا للمشروع" : "Request a project quote"}
            </a>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {serviceScopes.map(([title, description]) => (
              <article key={title} className="rounded-[1.5rem] border border-white/[0.08] bg-black/25 p-6">
                <h3 className="text-lg font-light text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="casting-brief" className="mt-8 scroll-mt-28 rounded-[2.25rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8 lg:p-10">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-gold">{isRtl ? "ابدأ المشروع" : "Start a project"}</p>
            <h2 className="mt-4 text-3xl font-light sm:text-4xl">{isRtl ? "أرسل احتياج الكاستينغ" : "Send your casting brief"}</h2>
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
