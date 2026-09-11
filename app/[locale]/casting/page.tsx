import type { Metadata } from "next";

import { CastingRequestForm } from "@/components/casting/CastingRequestForm";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");
const LAUNCH_CLIENT_LIMIT = 5;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale = "ar" } = await params;
  const isArabic = locale !== "en";
  const normalizedLocale = isArabic ? "ar" : "en";
  const canonicalUrl = `${SITE_URL}/${normalizedLocale}/casting`;
  const arUrl = `${SITE_URL}/ar/casting`;
  const enUrl = `${SITE_URL}/en/casting`;
  const title = isArabic ? "إدارة الكاستينغ للمشاريع في السعودية | MLAMH Casting" : "Managed Casting Service in Saudi Arabia | MLAMH Casting";
  const description = isArabic
    ? "خدمة Managed Casting للشركات وجهات الإنتاج والوكالات والعلامات: من الـBrief والبحث والفرز إلى اختيار العميل وتأكيد المواهب والحجز."
    : "Managed casting for companies, production teams, agencies, and brands: from brief, sourcing, and screening to client selection, talent confirmation, and booking.";

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl, languages: { "ar-SA": arUrl, en: enUrl, "x-default": arUrl } },
    openGraph: { type: "website", locale: isArabic ? "ar_SA" : "en_US", title, description, url: canonicalUrl, siteName: isArabic ? "ملامح" : "MLAMH", images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`${SITE_URL}/og-image.png`] },
  };
}

export default async function CastingPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale: rawLocale = "ar" } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";
  const pageUrl = `${SITE_URL}/${locale}/casting`;

  let launchSpotsRemaining = 0;
  try {
    const admin = createAdminClient();
    const { data: launchProjects, error: launchError } = await admin
      .from("casting_projects")
      .select("launch_offer_slot")
      .eq("service_mode", "managed")
      .not("launch_offer_slot", "is", null);
    if (launchError) {
      console.error("[CastingPage launch availability]", launchError);
    } else {
      const usedSlots = new Set(
        (launchProjects ?? [])
          .map((item) => Number(item.launch_offer_slot))
          .filter((slot) => Number.isInteger(slot) && slot >= 1 && slot <= LAUNCH_CLIENT_LIMIT),
      ).size;
      launchSpotsRemaining = Math.max(0, LAUNCH_CLIENT_LIMIT - usedSlots);
    }
  } catch (error) {
    console.error("[CastingPage launch availability]", error);
  }
  const launchOfferAvailable = launchSpotsRemaining > 0;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isRtl ? "ملامح" : "MLAMH", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isRtl ? "إدارة الكاستينغ" : "Managed Casting", item: pageUrl },
    ],
  };
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: isRtl ? "خدمة إدارة الكاستينغ من ملامح" : "MLAMH Managed Casting Service",
    description: isRtl
      ? "إدارة احتياج الممثلين والمودلز من الـBrief والبحث والفرز إلى اختيار العميل وتأكيد الموهبة والحجز."
      : "Managed actor and model casting from brief, sourcing, and screening to client selection, talent confirmation, and booking.",
    provider: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "MLAMH", alternateName: "ملامح", url: SITE_URL },
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
    url: pageUrl,
  };

  const steps = isRtl
    ? [
        ["01", "أرسل الـ Brief", "أرسل احتياج المشروع والمتطلبات الأساسية، بدون الحاجة لتجهيز إعلان كامل."],
        ["02", "نبحث ونفرز", "نحوّل الاحتياج إلى Roles، ونستخدم المطابقة الداخلية والدعوات والطلبات للوصول إلى المرشحين المناسبين."],
        ["03", "راجع الـ Shortlist", "تحصل على مساحة عميل خاصة لمراجعة المرشحين واختيار الأساسي والاحتياط واعتماد القرار."],
        ["04", "نؤكد ونحجز", "بعد اعتمادك نتولى تأكيد المواهب المختارة، تفاصيل الحجز، التنفيذ، والملفات المرتبطة بالمشروع."],
      ]
    : [
        ["01", "Send the brief", "Share the project need and core requirements without preparing a complete casting notice."],
        ["02", "We source & screen", "We structure roles and use internal matching, targeted invitations, and applications to build the right pool."],
        ["03", "Review the shortlist", "Use your private client workspace to select primary and reserve talent and confirm the decision."],
        ["04", "We confirm & book", "MLAMH coordinates talent confirmation, booking details, delivery, and project files after your approval."],
      ];

  const serviceScopes = isRtl
    ? [
        ["Managed Basic", "تنظيم الـBrief، إعداد نطاق الكاستينغ، استقبال الطلبات، والـShortlist الجاهزة للمراجعة."],
        ["Managed Pro", "بحث نشط ودعوات موجهة، Screening، Shortlist، تنسيق التوفر، وتأكيد المواهب المختارة."],
        ["Managed Enterprise", "مشاريع متعددة الأدوار أو الأحجام الكبيرة، نطاق مخصص، تشغيل أعمق، وتسليمات واحتياجات خاصة بالمشروع."],
      ]
    : [
        ["Managed Basic", "Brief structuring, casting setup, organized application intake, and a review-ready shortlist."],
        ["Managed Pro", "Active sourcing, targeted invitations, screening, shortlist delivery, availability coordination, and talent confirmation."],
        ["Managed Enterprise", "Multi-role or larger-volume projects with custom scope, deeper operations, and project-specific delivery needs."],
      ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black px-5 pb-24 pt-28 text-white sm:px-8 lg:px-10 lg:pt-36">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3"><p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CASTING</p><span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] text-gold">Managed Casting</span>{launchOfferAvailable ? <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-1 text-[11px] text-emerald-200">{isRtl ? `${launchSpotsRemaining} من 5 متاحة مجانًا` : `${launchSpotsRemaining} of 5 free spots available`}</span> : null}</div>
            <h1 className="mt-6 text-4xl font-light leading-tight sm:text-5xl lg:text-7xl">{isRtl ? "من الـBrief إلى موهبة مؤكدة وجاهزة للتنفيذ." : "From brief to confirmed talent, ready to work."}</h1>
            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">{isRtl ? "خدمة كاستينغ مُدارة للشركات وجهات الإنتاج والوكالات والعلامات. تتولى ملامح تنظيم الاحتياج، البحث والمطابقة، استقبال الطلبات والفرز، تسليم الـShortlist، ثم تأكيد المواهب والحجز بعد قرار العميل." : "A managed casting service for companies, production teams, agencies, and brands. MLAMH structures the brief, sources and matches talent, manages applications and screening, delivers the shortlist, then coordinates confirmation and booking after the client decision."}</p>
            <a href="#casting-brief" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110">{isRtl ? "أرسل الـ Brief" : "Send a casting brief"}</a>
          </div>
        </section>

        {launchOfferAvailable ? <section className="mt-5 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/[0.045] p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">LAUNCH COHORT · {launchSpotsRemaining}/{LAUNCH_CLIENT_LIMIT}</p>
              <h2 className="mt-2 text-xl font-light text-white">{isRtl ? `متبقي ${launchSpotsRemaining} من 5 — أول مشروع بدون رسوم إدارة الكاستينغ` : `${launchSpotsRemaining} of 5 remain — first project with no casting management fee`}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{isRtl ? "المقعد المجاني يُحجز بعد مراجعة الـBrief وقبول المشروع فعليًا، وليس بمجرد إرسال الطلب. لكل عميل مشروع إطلاق مجاني واحد." : "A free place is reserved only after MLAMH reviews and accepts the brief, not merely when a request is submitted. One launch project per client."}</p>
            </div>
            <a href="#casting-brief" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 px-5 py-2.5 text-sm text-emerald-200">{isRtl ? "اطلب مقعد الإطلاق" : "Request a launch place"}</a>
          </div>
        </section> : <section className="mt-5 rounded-[1.75rem] border border-gold/15 bg-gold/[0.035] p-5 sm:p-6"><p className="text-xs uppercase tracking-[0.22em] text-gold">MANAGED CASTING</p><h2 className="mt-2 text-xl font-light text-white">{isRtl ? "اكتملت دفعة الإطلاق المجانية" : "The free launch cohort is complete"}</h2><p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{isRtl ? "أرسل الـBrief للحصول على نطاق وعرض مخصص للمشروع. لا يوجد أي التزام مالي بمجرد إرسال الطلب." : "Send your brief to receive a project-specific scope and quote. Submitting a request creates no payment commitment."}</p></section>}

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{steps.map(([number,title,description])=><article key={number} className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6"><span className="text-sm text-gold">{number}</span><h2 className="mt-4 text-xl font-light">{title}</h2><p className="mt-3 text-sm leading-7 text-white/50">{description}</p></article>)}</section>

        <section className="mt-8 rounded-[2.25rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs uppercase tracking-[0.25em] text-gold">{isRtl ? "نطاق الخدمة" : "SERVICE SCOPE"}</p><h2 className="mt-4 text-3xl font-light">{isRtl ? "ثلاثة مستويات تشغيل حسب احتياج المشروع" : "Three operating scopes for different project needs"}</h2><p className="mt-4 text-sm leading-8 text-white/50">{isRtl ? "نراجع كل Brief أولًا ثم نحدد المستوى والنطاق والعرض المناسب حسب عدد الأدوار، حجم البحث، ومتطلبات الفرز والتأكيد. إرسال الطلب لا ينشئ التزامًا ماليًا." : "We review every brief first, then define the service scope and quote based on roles, sourcing volume, screening, and confirmation needs. Sending a brief creates no payment commitment."}</p></div><a href="#casting-brief" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 px-5 py-2.5 text-sm text-gold transition hover:bg-gold/10">{isRtl ? "اطلب عرضًا للمشروع" : "Request a project quote"}</a></div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">{serviceScopes.map(([title,description])=><article key={title} className="rounded-[1.5rem] border border-white/[0.08] bg-black/25 p-6"><h3 className="text-lg font-light text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-white/45">{description}</p></article>)}</div>
        </section>

        <section id="casting-brief" className="mt-8 scroll-mt-28 rounded-[2.25rem] border border-white/10 bg-white/[0.025] p-5 sm:p-8 lg:p-10">
          <div className="mb-8 max-w-3xl"><p className="text-xs uppercase tracking-[0.25em] text-gold">{isRtl ? "ابدأ المشروع" : "Start a project"}</p><h2 className="mt-4 text-3xl font-light sm:text-4xl">{isRtl ? "أرسل احتياج الكاستينغ" : "Send your casting brief"}</h2><p className="mt-4 text-sm leading-8 text-white/50">{isRtl ? "لا تحتاج إلى تجهيز إعلان كامل. أرسل ما تعرفه الآن، وسنراجع النطاق ونحدد الخطوة التالية قبل أي التزام أو نشر." : "You do not need a finished casting notice. Send what you know now and we will review the scope and define the next step before any commitment or publication."}</p></div>
          <CastingRequestForm locale={locale} />
        </section>
      </div>
    </main>
  );
}