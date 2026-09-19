import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import type { SeoLandingDefinition } from "@/lib/seo/acquisition-landings";

export function SeoAcquisitionLanding({
  locale,
  landing,
}: {
  locale: Locale;
  landing: SeoLandingDefinition;
}) {
  const isRtl = locale === "ar";
  const copy = landing[locale];

  const related = [
    { slug: "models-saudi-arabia", ar: "مودلز السعودية", en: "Models in Saudi Arabia" },
    { slug: "actors-saudi-arabia", ar: "ممثلين السعودية", en: "Actors in Saudi Arabia" },
    { slug: "casting-saudi-arabia", ar: "كاستنج السعودية", en: "Casting in Saudi Arabia" },
    { slug: "commercial-casting-saudi-arabia", ar: "كاستنج إعلانات", en: "Commercial Casting" },
    { slug: "models-riyadh", ar: "مودلز الرياض", en: "Models in Riyadh" },
    { slug: "actors-riyadh", ar: "ممثلين الرياض", en: "Actors in Riyadh" },
  ].filter((item) => item.slug !== landing.slug).slice(0, 5);

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-5 pb-24 pt-28 text-white sm:px-8 lg:px-10 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.18),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.28em] text-gold">{copy.eyebrow}</p>
            <h1 className="mt-6 text-4xl font-light leading-tight sm:text-5xl lg:text-7xl">{copy.heading}</h1>
            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">{copy.intro}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/${locale}/opportunities/new`}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-black transition hover:bg-gold-soft"
              >
                {isRtl ? "انشر فرصة كاستينج" : "Post a Casting Opportunity"}
              </Link>
              <Link
                href={`/${locale}/publisher-register`}
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-gold/35 px-8 text-sm text-gold transition hover:bg-gold/10"
              >
                {isRtl ? "إنشاء حساب ناشر" : "Create Publisher Account"}
              </Link>
              <Link
                href={`/${locale}/casting`}
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/10 px-8 text-sm text-white/70 transition hover:border-gold/25 hover:text-gold"
              >
                {isRtl ? "أرسل Brief لملامح" : "Send a Brief to MLAMH"}
              </Link>
            </div>

            <p className="mt-5 text-xs leading-6 text-white/35">
              {isRtl
                ? "هذه الصفحة لا تعرض أسماء أو صور أو ملفات المواهب الخاصة. الوصول للمواهب والتواصل يخضعان لمسارات وصلاحيات ملامح."
                : "This page does not expose private talent names, photos, or profiles. Talent access and communication remain governed by MLAMH workflows and permissions."}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
            <p className="text-xs uppercase tracking-[0.22em] text-gold">{isRtl ? "عن الاحتياج" : "ABOUT THE NEED"}</p>
            <h2 className="mt-4 text-3xl font-light sm:text-4xl">{copy.whyTitle}</h2>
            <p className="mt-5 text-sm leading-8 text-white/55 sm:text-base">{copy.whyText}</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {copy.projectTypes.map((item) => (
                <div key={item} className="rounded-[1.35rem] border border-white/[0.08] bg-black/25 px-5 py-4 text-sm text-white/65">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.22em] text-gold">{isRtl ? "للناشرين" : "FOR PUBLISHERS"}</p>
            <h2 className="mt-4 text-3xl font-light">{isRtl ? "بدل البحث اليدوي، انشر احتياجك." : "Instead of manual searching, post the requirement."}</h2>
            <p className="mt-5 text-sm leading-8 text-white/55">
              {isRtl
                ? "اكتب الفرصة مرة واحدة، حدد المدينة والدور والمتطلبات والمقابل، ثم استقبل الطلبات داخل ملامح. وإذا كان المشروع يحتاج تشغيلًا أعمق، استخدم خدمة الكاستينج المُدارة."
                : "Write the opportunity once, define the city, role, requirements and compensation, then receive applications inside MLAMH. For deeper operational support, use managed casting."}
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <Link href={`/${locale}/opportunities/new`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-5 text-sm font-medium text-black">
                {isRtl ? "إنشاء فرصة الآن" : "Create an Opportunity"}
              </Link>
              <Link href={`/${locale}/opportunities`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-sm text-white/65">
                {isRtl ? "استعرض الفرص المنشورة" : "Browse Published Opportunities"}
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">{isRtl ? "قبل النشر" : "BEFORE YOU POST"}</p>
          <h2 className="mt-4 text-3xl font-light sm:text-4xl">{copy.tipsTitle}</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {copy.tips.map((tip, index) => (
              <article key={tip} className="rounded-[1.5rem] border border-white/[0.08] bg-black/25 p-5">
                <span className="text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-3 text-sm leading-7 text-white/60">{tip}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-gold">{isRtl ? "أسئلة شائعة" : "FAQ"}</p>
          <h2 className="mt-4 text-3xl font-light sm:text-4xl">{isRtl ? "قبل أن تبدأ" : "Before you start"}</h2>
          <div className="mt-7 grid gap-4">
            {copy.faq.map((item) => (
              <article key={item.question} className="rounded-[1.5rem] border border-white/[0.08] bg-black/25 p-5 sm:p-6">
                <h3 className="text-lg font-light text-white">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-white/50">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.04] px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">{isRtl ? "ابدأ الآن" : "START NOW"}</p>
              <h2 className="mt-4 text-3xl font-light sm:text-4xl">
                {isRtl ? "لديك مشروع؟ انشر الفرصة ودع المواهب المناسبة تتقدم." : "Have a project? Post the opportunity and let relevant talent apply."}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/50">
                {isRtl
                  ? "هدف صفحات البحث هذه هو أن توصلك إلى ملامح بسرعة، ثم تنقل المشروع إلى مسار منظم بدل الرسائل والبحث العشوائي."
                  : "These search landing pages are designed to get you to MLAMH quickly, then move the project into a structured workflow instead of scattered outreach."}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/opportunities/new`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 text-sm font-medium text-black">
                {isRtl ? "انشر فرصة" : "Post Opportunity"}
              </Link>
              <Link href={`/${locale}/join/talent`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-6 text-sm text-white/65">
                {isRtl ? "أنا موهبة — انضم" : "I'm Talent — Join"}
              </Link>
            </div>
          </div>
        </section>

        <nav aria-label={isRtl ? "صفحات مرتبطة" : "Related pages"} className="mt-8 flex flex-wrap gap-2">
          {related.map((item) => (
            <Link key={item.slug} href={`/${locale}/${item.slug}`} className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/55 transition hover:border-gold/30 hover:text-gold">
              {isRtl ? item.ar : item.en}
            </Link>
          ))}
          <Link href={`/${locale}/publishers`} className="rounded-full border border-gold/20 bg-gold/[0.04] px-4 py-2 text-sm text-gold">
            {isRtl ? "للناشرين" : "For Publishers"}
          </Link>
        </nav>
      </div>
    </main>
  );
}
