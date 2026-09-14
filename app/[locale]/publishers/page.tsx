import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentAccountType } from "@/lib/auth/get-current-account-type";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale: rawLocale = "ar" } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const title = isArabic
    ? "انشر فرص المواهب في السعودية | ملامح للناشرين"
    : "Post Talent Opportunities in Saudi Arabia | MLAMH for Publishers";
  const description = isArabic
    ? "انشر فرص التمثيل والمودل، استقبل الطلبات، واختر المواهب المناسبة عبر ملامح — للأفراد وأصحاب المشاريع والمتاجر والأنشطة التجارية والشركات والوكالات والعلامات التجارية."
    : "Post acting and modeling opportunities, receive applications, and select the right talent on MLAMH — for individuals, project owners, stores, small businesses, companies, agencies, and brands.";
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

export default async function PublishersPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale: rawLocale = "ar" } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";
  const pageUrl = `${SITE_URL}/${locale}/publishers`;
  const accountType = await getCurrentAccountType();
  const isPublisher = accountType === "publisher";
  const hasKnownAccount = accountType !== null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isRtl ? "ملامح" : "MLAMH", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isRtl ? "للناشرين" : "For Publishers", item: pageUrl },
    ],
  };

  const steps = [
    {
      n: "01",
      ar: isPublisher ? "حساب الناشر" : "أنشئ حساب الناشر",
      en: isPublisher ? "Your publisher account" : "Create your publisher account",
      arText: isPublisher
        ? "حسابك موجود بالفعل. انتقل إلى لوحة الناشر لإدارة ملفك وطلباتك وفرصك."
        : "اختر فرد / صاحب مشروع، متجر / نشاط تجاري، أو شركة / جهة، وأكمل البيانات الأساسية المناسبة لمسارك.",
      enText: isPublisher
        ? "Your account already exists. Open the publisher dashboard to manage your profile, requests, and opportunities."
        : "Choose Individual / Project Owner, Store / Business, or Company / Organization and complete the essentials for your path.",
    },
    {
      n: "02",
      ar: "انشر احتياجك",
      en: "Post what you need",
      arText: "أنشئ طلبًا سريعًا أو فرصة كاستينغ وحدد نوع الموهبة والمدينة والمتطلبات والمقابل.",
      enText: "Create a Quick Request or Casting opportunity and set the talent type, city, requirements, and compensation.",
    },
    {
      n: "03",
      ar: "اكتشف المواهب",
      en: "Discover talent",
      arText: "راجع المتقدمين والمواهب المناسبة، ويمكنك دعوة موهبة إلى طلب أو فرصة منشورة من حسابك.",
      enText: "Review applicants and matched talent, and invite talent to a request or opportunity published from your account.",
    },
    {
      n: "04",
      ar: "ابدأ التواصل",
      en: "Start the conversation",
      arText: "يبدأ التواصل داخل ملامح عندما يُظهر أحد الطرفين اهتمامًا مرتبطًا بطلب أو فرصة، مع بقاء التواصل داخل المنصة.",
      enText: "Messaging starts inside MLAMH when either side expresses interest tied to a request or opportunity, keeping communication on-platform.",
    },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-5 pb-24 pt-32 text-white sm:px-8 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="relative max-w-4xl">
            <p className="text-xs text-gold">{isRtl ? "ملامح للناشرين" : "MLAMH for Publishers"}</p>
            <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
              {isRtl ? "تحتاج ممثلًا أو مودل؟ انشر احتياجك وابدأ من هنا." : "Need an actor or model? Post what you need and start here."}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">
              {isRtl
                ? "ملامح تجمع الأفراد وأصحاب المشاريع والمتاجر والأنشطة التجارية والشركات والوكالات والعلامات التجارية مع المواهب المناسبة في تجربة واحدة سريعة ومنظمة."
                : "MLAMH connects individuals, project owners, stores, small businesses, companies, agencies, and brands with the right talent through one fast, organized experience."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {isPublisher ? (
                <>
                  <Link href={`/${locale}/publisher-dashboard`} className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-black transition hover:bg-gold-soft">
                    {isRtl ? "لوحة الناشر" : "Publisher Dashboard"}
                  </Link>
                  <Link href={`/${locale}/publisher-dashboard/opportunities/new`} className="inline-flex min-h-14 items-center justify-center rounded-full border border-gold/35 px-8 text-sm text-gold transition hover:bg-gold/10">
                    {isRtl ? "إنشاء طلب أو فرصة" : "Create a Request or Opportunity"}
                  </Link>
                </>
              ) : hasKnownAccount ? (
                <Link href={`/${locale}/dashboard-router`} className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-black transition hover:bg-gold-soft">
                  {isRtl ? "الانتقال إلى حسابي" : "Go to My Account"}
                </Link>
              ) : (
                <>
                  <Link href={`/${locale}/publisher-register`} className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-black transition hover:bg-gold-soft">
                    {isRtl ? "ابدأ كناشر" : "Start as a Publisher"}
                  </Link>
                  <Link href={`/${locale}/login`} className="inline-flex min-h-14 items-center justify-center rounded-full border border-gold/35 px-8 text-sm text-gold transition hover:bg-gold/10">
                    {isRtl ? "تسجيل الدخول" : "Sign In"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8">
            <p className="text-xs text-gold">{isRtl ? "مسار سريع" : "Fast Track"}</p>
            <h2 className="mt-4 text-3xl font-light">{isRtl ? "فرد / صاحب مشروع" : "Individual / Project Owner"}</h2>
            <p className="mt-5 text-sm leading-8 text-white/60">
              {isRtl
                ? "للمصورين ومنظمي الفعاليات وأصحاب المشاريع والاحتياجات الفردية. إعداد مختصر يوصلك مباشرة إلى إنشاء طلبك."
                : "For photographers, event organizers, project owners, and individual needs. A lightweight setup takes you straight to creating your request."}
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/50">
              {isRtl ? "بيانات أساسية → إنشاء الطلب → المراجعة والنشر." : "Essentials → create request → review and publish."}
            </div>
          </article>

          <article className="rounded-[2rem] border border-gold/20 bg-gold/[0.025] p-6 sm:p-8">
            <p className="text-xs text-gold">{isRtl ? "مسار سريع للأعمال" : "Business Fast Track"}</p>
            <h2 className="mt-4 text-3xl font-light">{isRtl ? "متجر / نشاط تجاري" : "Store / Business"}</h2>
            <p className="mt-5 text-sm leading-8 text-white/60">
              {isRtl
                ? "للمتاجر والصالونات والمشاريع التجارية الصغيرة التي تحتاج مودلز أو ممثلين للتصوير والمحتوى والحملات."
                : "For stores, salons, and small businesses that need models or actors for shoots, content, and campaigns."}
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/50">
              {isRtl ? "اسم النشاط ونوعه والمدينة → إنشاء الطلب → المراجعة والنشر." : "Business name, type, and city → create request → review and publish."}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <p className="text-xs text-gold">{isRtl ? "حضور احترافي" : "Professional Presence"}</p>
            <h2 className="mt-4 text-3xl font-light">{isRtl ? "شركة / مؤسسة / جهة" : "Company / Organization"}</h2>
            <p className="mt-5 text-sm leading-8 text-white/60">
              {isRtl
                ? "للشركات ووكالات الإعلان والكاستينغ ووكالات المواهب والعلامات التجارية وشركات المحتوى. ملف جهة احترافي، مراجعة حساب، وتوثيق اختياري لزيادة الثقة."
                : "For companies, advertising and casting agencies, talent agencies, brands, and content companies. Professional organization profile, account review, and optional verification for added trust."}
            </p>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/50">
              {isRtl ? "الاعتماد يفتح صلاحيات الناشر، والتوثيق خطوة منفصلة واختيارية لإضافة شارة الثقة." : "Account approval unlocks publisher access; verification is a separate optional trust badge."}
            </div>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl">
            <p className="text-xs text-gold">{isRtl ? "كيف تعمل ملامح؟" : "How MLAMH Works"}</p>
            <h2 className="mt-4 text-3xl font-light sm:text-4xl">{isRtl ? "من الاحتياج إلى الموهبة المناسبة" : "From a talent need to the right person"}</h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article key={step.n} className="rounded-[1.5rem] border border-white/[0.08] bg-black/20 p-5">
                <span className="text-sm text-gold">{step.n}</span>
                <h3 className="mt-4 text-xl font-light text-white">{isRtl ? step.ar : step.en}</h3>
                <p className="mt-3 text-sm leading-7 text-white/45">{isRtl ? step.arText : step.enText}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-gold/20 bg-gold/[0.04] px-6 py-10 text-center sm:px-10 sm:py-12">
          <h2 className="text-3xl font-light sm:text-4xl">{isRtl ? "فرصتك القادمة تبدأ بطلب واضح." : "Your next booking starts with a clear opportunity."}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/50">
            {isPublisher
              ? isRtl
                ? "أنت مسجل كناشر. انتقل إلى لوحة الناشر لإدارة حسابك أو ابدأ طلبًا أو فرصة جديدة."
                : "You are signed in as a publisher. Open your dashboard to manage your account or start a new request or opportunity."
              : hasKnownAccount
                ? isRtl
                  ? "أنت مسجل الدخول حاليًا. انتقل إلى حسابك للمتابعة."
                  : "You are currently signed in. Go to your account to continue."
                : isRtl
                  ? "أنشئ حساب الناشر، اختر المسار المناسب لك، وانشر أول فرصة عندما يصبح حسابك جاهزًا."
                  : "Create your publisher account, choose the right path, and post your first opportunity when your account is ready."}
          </p>
          {isPublisher ? (
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={`/${locale}/publisher-dashboard`} className="inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-9 text-sm font-medium text-black transition hover:bg-gold-soft">
                {isRtl ? "لوحة الناشر" : "Publisher Dashboard"}
              </Link>
              <Link href={`/${locale}/publisher-dashboard/opportunities/new`} className="inline-flex min-h-14 items-center justify-center rounded-full border border-gold/35 px-9 text-sm text-gold transition hover:bg-gold/10">
                {isRtl ? "إنشاء طلب أو فرصة" : "Create a Request or Opportunity"}
              </Link>
            </div>
          ) : hasKnownAccount ? (
            <Link href={`/${locale}/dashboard-router`} className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-9 text-sm font-medium text-black transition hover:bg-gold-soft">
              {isRtl ? "الانتقال إلى حسابي" : "Go to My Account"}
            </Link>
          ) : (
            <Link href={`/${locale}/publisher-register`} className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-gold px-9 text-sm font-medium text-black transition hover:bg-gold-soft">
              {isRtl ? "إنشاء حساب ناشر" : "Create Publisher Account"}
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
