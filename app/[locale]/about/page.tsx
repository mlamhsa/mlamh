import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale === "ar";

  return {
    title: isArabic ? "عن ملامح | ملامح" : "About MLAMH | MLAMH",
    description: isArabic
      ? "تعرّف على منصة ملامح ورؤيتها ورسالتها في ربط المواهب الإبداعية بالشركات والفرص."
      : "Learn about MLAMH, its vision, mission, and role in connecting creative talent with companies and opportunities.",
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale = "ar" } = await params;
  const isRtl = locale === "ar";

  const values = [
    {
      number: "01",
      titleAr: "الاحترافية",
      titleEn: "Professionalism",
      descriptionAr:
        "نبني تجربة واضحة ومنظمة تساعد المواهب والشركات على التعامل بثقة.",
      descriptionEn:
        "We create a clear and organized experience that helps talent and companies collaborate with confidence.",
    },
    {
      number: "02",
      titleAr: "الفرص المتكافئة",
      titleEn: "Equal Opportunity",
      descriptionAr:
        "نؤمن بأن الوصول إلى الفرص يجب أن يعتمد على الموهبة والخبرة والملاءمة.",
      descriptionEn:
        "We believe access to opportunities should be based on talent, experience, and suitability.",
    },
    {
      number: "03",
      titleAr: "الشفافية",
      titleEn: "Transparency",
      descriptionAr:
        "نسعى إلى تقديم معلومات واضحة عن الفرص والطلبات وحالات التقديم.",
      descriptionEn:
        "We aim to provide clear information about opportunities, applications, and their status.",
    },
    {
      number: "04",
      titleAr: "دعم الإبداع",
      titleEn: "Supporting Creativity",
      descriptionAr:
        "نساعد المواهب والجهات الإبداعية على بناء علاقات مهنية وفرص مستدامة.",
      descriptionEn:
        "We help talent and creative organizations build professional relationships and sustainable opportunities.",
    },
  ];

  const offerings = [
    {
      titleAr: "ملفات احترافية للمواهب",
      titleEn: "Professional Talent Profiles",
      descriptionAr:
        "مساحة تعرض خبرات الموهبة ومهاراتها وأعمالها ومعلوماتها المهنية.",
      descriptionEn:
        "A dedicated space for talent to present experience, skills, work, and professional information.",
    },
    {
      titleAr: "نشر الفرص وإدارتها",
      titleEn: "Opportunity Publishing",
      descriptionAr:
        "تمكين الشركات والجهات من نشر الفرص وتوضيح متطلبات كل مشروع.",
      descriptionEn:
        "Companies and organizations can publish opportunities and define project requirements.",
    },
    {
      titleAr: "التقديم المباشر",
      titleEn: "Direct Applications",
      descriptionAr:
        "تستطيع المواهب استعراض الفرص المناسبة والتقديم عليها من المنصة.",
      descriptionEn:
        "Talent can discover relevant opportunities and apply through the platform.",
    },
    {
      titleAr: "إدارة الطلبات",
      titleEn: "Application Management",
      descriptionAr:
        "أدوات تساعد الجهات على مراجعة الطلبات والوصول إلى الموهبة المناسبة.",
      descriptionEn:
        "Tools that help organizations review applications and identify suitable talent.",
    },
  ];

  const faqs = [
    {
      questionAr: "ما هي منصة ملامح؟",
      questionEn: "What is MLAMH?",
      answerAr:
        "ملامح منصة رقمية سعودية تربط المواهب الإبداعية بالشركات وجهات الإنتاج والوكالات والفرص المهنية.",
      answerEn:
        "MLAMH is a Saudi digital platform connecting creative talent with companies, production teams, agencies, and professional opportunities.",
    },
    {
      questionAr: "من يمكنه التسجيل في ملامح؟",
      questionEn: "Who can register on MLAMH?",
      answerAr:
        "يمكن للمواهب الإبداعية إنشاء ملفاتها المهنية، كما يمكن للشركات وجهات الإنتاج والوكالات إنشاء حسابات لنشر الفرص وإدارة الطلبات.",
      answerEn:
        "Creative talent can create professional profiles, while companies, production teams, and agencies can create accounts to publish opportunities and manage applications.",
    },
    {
      questionAr: "كيف تستفيد المواهب من المنصة؟",
      questionEn: "How does MLAMH help talent?",
      answerAr:
        "تساعد المنصة المواهب على عرض خبراتها وأعمالها، اكتشاف الفرص المناسبة، والتقديم عليها من خلال تجربة منظمة.",
      answerEn:
        "The platform helps talent present their experience and work, discover suitable opportunities, and submit applications through an organized experience.",
    },
    {
      questionAr: "كيف تستفيد الشركات من ملامح؟",
      questionEn: "How does MLAMH help companies?",
      answerAr:
        "تستطيع الشركات نشر الفرص، تحديد متطلبات المشروع، مراجعة ملفات المتقدمين، وإدارة الطلبات من مكان واحد.",
      answerEn:
        "Companies can publish opportunities, define project requirements, review applicant profiles, and manage applications in one place.",
    },
    {
      questionAr: "هل تدعم ملامح اللغة العربية والإنجليزية؟",
      questionEn: "Does MLAMH support Arabic and English?",
      answerAr:
        "نعم، تقدم ملامح تجربة باللغتين العربية والإنجليزية لتسهيل الوصول إلى المنصة واستخدامها.",
      answerEn:
        "Yes. MLAMH provides both Arabic and English experiences to make the platform easier to access and use.",
    },
  ];

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: isRtl ? faq.questionAr : faq.questionEn,
      acceptedAnswer: {
        "@type": "Answer",
        text: isRtl ? faq.answerAr : faq.answerEn,
      },
    })),
  };

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-x-16 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <div className="relative max-w-4xl">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.28em]"
              }`}
            >
              {isRtl ? "عن ملامح" : "About MLAMH"}
            </p>

            <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
              {isRtl
                ? "منصة تجمع المواهب بالفرص"
                : "Connecting Talent with Opportunity"}
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "ملامح منصة رقمية سعودية تهدف إلى ربط المواهب الإبداعية بجهات الإنتاج والشركات والوكالات، من خلال تجربة احترافية ومنظمة تساعد الجميع على الوصول إلى الفرصة أو الموهبة المناسبة."
                : "MLAMH is a Saudi digital platform connecting creative talent with production companies, agencies, and brands through a professional and organized experience."}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "رؤيتنا" : "Our Vision"}
            </p>

            <h2 className="mt-4 text-3xl font-light">
              {isRtl
                ? "مجتمع احترافي للمواهب الإبداعية"
                : "A professional creative talent community"}
            </h2>

            <p className="mt-5 text-sm leading-8 text-white/60">
              {isRtl
                ? "أن تصبح ملامح منصة رائدة للمواهب الإبداعية في المنطقة، وأن تسهّل على الشركات والجهات الوصول إلى الأشخاص المناسبين بسرعة وكفاءة."
                : "To make MLAMH a leading platform for creative talent in the region and help companies discover the right people efficiently."}
            </p>
          </article>

          <article className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "رسالتنا" : "Our Mission"}
            </p>

            <h2 className="mt-4 text-3xl font-light">
              {isRtl
                ? "تبسيط الوصول إلى المواهب والفرص"
                : "Simplifying access to talent and opportunity"}
            </h2>

            <p className="mt-5 text-sm leading-8 text-white/60">
              {isRtl
                ? "تبسيط عملية اكتشاف المواهب، وتسريع الوصول إلى الفرص المناسبة، وتوفير أدوات منظمة تدعم العلاقات المهنية والاقتصاد الإبداعي."
                : "To simplify talent discovery, improve access to relevant opportunities, and provide organized tools that support professional relationships and the creative economy."}
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "قيم المنصة" : "Our Values"}
            </p>

            <h2 className="mt-4 text-3xl font-light sm:text-4xl">
              {isRtl
                ? "المبادئ التي نبني عليها ملامح"
                : "The principles behind MLAMH"}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.number}
                className="rounded-[1.5rem] border border-white/[0.08] bg-black/20 p-5"
              >
                <span className="text-sm text-gold">{value.number}</span>

                <h3 className="mt-4 text-xl font-light text-white">
                  {isRtl ? value.titleAr : value.titleEn}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/50">
                  {isRtl ? value.descriptionAr : value.descriptionEn}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "ماذا نقدم؟" : "What We Offer"}
            </p>

            <h2 className="mt-4 text-3xl font-light sm:text-4xl">
              {isRtl
                ? "تجربة متكاملة للمواهب والشركات"
                : "An integrated experience for talent and companies"}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {offerings.map((offering) => (
              <article
                key={offering.titleEn}
                className="rounded-[1.5rem] border border-white/[0.08] bg-black/20 p-5 sm:p-6"
              >
                <h3 className="text-xl font-light text-white">
                  {isRtl ? offering.titleAr : offering.titleEn}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/50">
                  {isRtl
                    ? offering.descriptionAr
                    : offering.descriptionEn}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </p>

            <h2 className="mt-4 text-3xl font-light sm:text-4xl">
              {isRtl
                ? "إجابات عن أبرز الأسئلة"
                : "Answers to common questions"}
            </h2>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={faq.questionEn}
                className="group rounded-[1.5rem] border border-white/[0.08] bg-black/20"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-base text-white sm:px-6">
                  <span>
                    {isRtl ? faq.questionAr : faq.questionEn}
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 text-gold transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>

                <div className="border-t border-white/[0.06] px-5 py-5 sm:px-6">
                  <p className="text-sm leading-8 text-white/55">
                    {isRtl ? faq.answerAr : faq.answerEn}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}