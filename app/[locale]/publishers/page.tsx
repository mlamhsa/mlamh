import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale = "ar" } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const title = isArabic
    ? "منصة اكتشاف المواهب للشركات في السعودية | ملامح"
    : "Talent Discovery Platform for Companies in Saudi Arabia | MLAMH";
  const description = isArabic
    ? "اكتشف ممثلين ومودلز، انشر فرص الكاستينغ، وأدر طلبات التقديم عبر ملامح للشركات والوكالات وجهات الإنتاج في السعودية."
    : "Discover actors and models, publish casting opportunities, and manage applications through MLAMH for companies, agencies, and production teams in Saudi Arabia.";
  const canonical = `${SITE_URL}/${locale}/publishers`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/publishers`,
        en: `${SITE_URL}/en/publishers`,
        "x-default": `${SITE_URL}/ar/publishers`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "MLAMH | ملامح",
      type: "website",
      locale: isArabic ? "ar_SA" : "en_US",
      images: [`${SITE_URL}/og-image.png`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublishersPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale: rawLocale = "ar" } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";
  const pageUrl = `${SITE_URL}/${locale}/publishers`;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: isRtl ? "ملامح" : "MLAMH",
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isRtl ? "ملامح للشركات" : "MLAMH for Companies",
        item: pageUrl,
      },
    ],
  };
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: isRtl ? "منصة اكتشاف المواهب للشركات في السعودية" : "Talent Discovery Platform for Companies in Saudi Arabia",
    description: isRtl
      ? "صفحة ملامح للشركات والوكالات وجهات الإنتاج لاكتشاف المواهب ونشر الفرص وإدارة طلبات التقديم."
      : "MLAMH for companies, agencies and production teams to discover talent, publish opportunities and manage applications.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    inLanguage: isRtl ? "ar-SA" : "en",
  };

  const benefits = [
    {
      ar: "الوصول إلى قاعدة متنوعة من المواهب الإبداعية.",
      en: "Access a diverse network of creative talent.",
    },
    {
      ar: "نشر الفرص واستقبال طلبات المواهب في مكان واحد.",
      en: "Publish opportunities and receive talent applications in one place.",
    },
    {
      ar: "مراجعة الملفات الشخصية والأعمال والخبرات بسهولة.",
      en: "Review profiles, portfolios, and experience with ease.",
    },
    {
      ar: "إدارة الطلبات واختيار المواهب المناسبة للمشروع.",
      en: "Manage applications and select the right talent for each project.",
    },
  ];

  const steps = [
    {
      number: "01",
      arTitle: "أنشئ حساب جهة",
      enTitle: "Create a company account",
      arDescription:
        "سجّل بيانات شركتك أو جهة الإنتاج وابدأ في بناء حضورك على ملامح.",
      enDescription:
        "Register your company or production entity and establish your presence on MLAMH.",
    },
    {
      number: "02",
      arTitle: "انشر الفرصة",
      enTitle: "Publish an opportunity",
      arDescription:
        "أضف متطلبات المشروع، نوع الموهبة، المدينة، الميزانية، وموعد التقديم.",
      enDescription:
        "Add the project requirements, talent type, city, budget, and application deadline.",
    },
    {
      number: "03",
      arTitle: "راجع الطلبات",
      enTitle: "Review applications",
      arDescription:
        "استعرض المواهب المتقدمة وقارن الملفات والخبرات من لوحة التحكم.",
      enDescription:
        "Review applicants and compare profiles and experience from your dashboard.",
    },
    {
      number: "04",
      arTitle: "اختر الموهبة",
      enTitle: "Select your talent",
      arDescription:
        "اختر الأنسب للمشروع وتابع حالة الطلب من خلال منصة ملامح.",
      enDescription:
        "Choose the best fit and follow the application through the MLAMH platform.",
    },
  ];

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-5 pb-24 pt-36 text-white sm:px-8 lg:px-10"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
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
              {isRtl ? "ملامح للشركات" : "MLAMH for Companies"}
            </p>

            <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
              {isRtl
                ? "اكتشف الممثلين والمودلز المناسبين لمشروعك"
                : "Discover the right actors and models for your project"}
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "تساعد ملامح الشركات وجهات الإنتاج والوكالات على اكتشاف المواهب، نشر فرص الكاستينغ، استقبال الطلبات، وإدارة عملية الاختيار في تجربة احترافية ومنظمة."
                : "MLAMH helps companies, production teams, and agencies discover actors and models, publish casting opportunities, receive applications, and manage selection through a professional experience."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/${locale}/publisher-register`}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-black transition hover:bg-gold-soft"
              >
                {isRtl ? "إنشاء حساب شركة" : "Create Company Account"}
              </Link>

              <Link
                href={`/${locale}/login`}
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-gold/35 px-8 text-sm text-gold transition hover:bg-gold/10"
              >
                {isRtl ? "تسجيل دخول الشركات" : "Company Login"}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "لماذا ملامح؟" : "Why MLAMH?"}
            </p>

            <h2 className="mt-4 text-3xl font-light">
              {isRtl
                ? "كل ما تحتاجه لإدارة اختيار المواهب"
                : "Everything you need to manage talent selection"}
            </h2>

            <div className="mt-7 space-y-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.en}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-xs text-gold">
                    ✓
                  </span>

                  <p className="text-sm leading-7 text-white/60">
                    {isRtl ? benefit.ar : benefit.en}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
            <p
              className={`text-xs text-gold ${
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.25em]"
              }`}
            >
              {isRtl ? "للشركات والجهات" : "For companies and teams"}
            </p>

            <h2 className="mt-4 text-3xl font-light">
              {isRtl
                ? "ابنِ فريق مشروعك بثقة"
                : "Build your project team with confidence"}
            </h2>

            <p className="mt-5 text-sm leading-8 text-white/60">
              {isRtl
                ? "سواء كنت شركة إنتاج، وكالة إعلانية، علامة تجارية، أو جهة تنظم فعالية، تساعدك ملامح في الوصول إلى المواهب التي تتوافق مع احتياج مشروعك."
                : "Whether you are a production company, agency, brand, or event organizer, MLAMH helps you reach talent that matches your project requirements."}
            </p>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <p className="text-sm leading-7 text-white/50">
                {isRtl
                  ? "يمكنك إدارة فرصك وطلبات المواهب من لوحة تحكم مخصصة للشركات."
                  : "Manage your opportunities and talent applications from a dedicated company dashboard."}
              </p>

              <Link
                href={`/${locale}/publisher-dashboard`}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-gold/35 text-sm text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl
                  ? "الانتقال إلى لوحة الشركات"
                  : "Open Company Dashboard"}
              </Link>
            </div>
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
              {isRtl ? "كيف تعمل المنصة؟" : "How it works"}
            </p>

            <h2 className="mt-4 text-3xl font-light sm:text-4xl">
              {isRtl
                ? "من نشر الفرصة إلى اختيار الموهبة"
                : "From publishing to selecting talent"}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[1.5rem] border border-white/[0.08] bg-black/20 p-5"
              >
                <span className="text-sm text-gold">{step.number}</span>

                <h3 className="mt-4 text-xl font-light text-white">
                  {isRtl ? step.arTitle : step.enTitle}
                </h3>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {isRtl ? step.arDescription : step.enDescription}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-gold/25 bg-[linear-gradient(135deg,rgba(201,169,98,0.11),rgba(255,255,255,0.02))] p-7 text-center sm:p-10">
          <h2 className="text-3xl font-light sm:text-4xl">
            {isRtl
              ? "جاهز للعثور على موهبتك القادمة؟"
              : "Ready to discover your next talent?"}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/55">
            {isRtl
              ? "أنشئ حساب شركتك وابدأ بنشر الفرص واستقبال طلبات المواهب."
              : "Create your company account, publish opportunities, and begin receiving talent applications."}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/publisher-register`}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-9 text-sm font-medium text-black transition hover:bg-gold-soft"
            >
              {isRtl ? "ابدأ الآن" : "Get Started"}
            </Link>
            <Link
              href={`/${locale}/casting`}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-gold/35 px-9 text-sm text-gold transition hover:bg-gold/10"
            >
              {isRtl ? "خدمة إدارة الكاستينغ" : "Managed Casting Service"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
