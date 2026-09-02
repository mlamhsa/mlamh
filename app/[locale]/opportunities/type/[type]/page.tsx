import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublishedOpportunities } from "@/lib/supabase/opportunities";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

const TYPES = {
  acting: {
    accepted: new Set(["actor", "actress", "extra"]),
    ar: {
      title: "فرص تمثيل في السعودية | كاستينج ومطلوب ممثلين | ملامح",
      description: "اكتشف فرص التمثيل والكاستينج وتجارب الأداء ومشاريع مطلوب ممثلين وممثلات لها في السعودية. تصفح الفرص المنشورة وتقدم عبر ملامح.",
      h1: "فرص تمثيل وكاستينج في السعودية",
      intro: "تصفح فرص التمثيل وتجارب الأداء والمشاريع التي تبحث عن ممثلين وممثلات وكومبارس في السعودية، من الإعلانات والمحتوى التجاري إلى الإنتاج المرئي.",
      secondaryTitle: "تبحث عن فرص مطلوب ممثلين أو تجارب أداء؟",
      secondaryBody: "تجمع ملامح الفرص المنشورة في مكان واحد لتستطيع مراجعة المدينة والمتطلبات والمقابل ثم التقديم من ملفك المهني بدل الاعتماد على إعلانات متفرقة.",
    },
    en: {
      title: "Acting Opportunities & Casting Calls in Saudi Arabia | MLAMH",
      description: "Discover acting jobs, auditions and casting calls for actors, actresses and extras in Saudi Arabia and apply through MLAMH.",
      h1: "Acting Opportunities & Casting Calls in Saudi Arabia",
      intro: "Browse acting jobs, auditions and casting calls for actors, actresses and extras across Saudi Arabia, including commercials and screen productions.",
      secondaryTitle: "Looking for acting jobs or auditions?",
      secondaryBody: "MLAMH brings published opportunities into one place so you can review requirements, location and compensation before applying with your professional profile.",
    },
  },
  modeling: {
    accepted: new Set(["model"]),
    ar: {
      title: "فرص مودل في السعودية | مطلوب مودلز للتصوير والإعلانات | ملامح",
      description: "اكتشف فرص مودل ووظائف تصوير ومشاريع مطلوب مودلز لها للإعلانات والمحتوى التجاري في السعودية، وتقدم للفرص المنشورة عبر ملامح.",
      h1: "فرص مودل وتصوير في السعودية",
      intro: "تصفح فرص المودل والتصوير الإعلاني والمشاريع التي تبحث عن مودلز في السعودية، مع تفاصيل تساعدك على معرفة متطلبات كل فرصة قبل التقديم.",
      secondaryTitle: "تبحث عن مطلوب مودل أو فرص تصوير إعلانات؟",
      secondaryBody: "بدل متابعة إعلانات متفرقة، استعرض فرص المودل والتصوير المنشورة على ملامح وتقدم للفرص المناسبة من خلال ملفك المهني.",
    },
    en: {
      title: "Modeling Jobs & Photo Shoot Opportunities in Saudi Arabia | MLAMH",
      description: "Discover modeling jobs, commercial shoots and model opportunities in Saudi Arabia and apply through MLAMH.",
      h1: "Modeling Jobs & Photo Shoot Opportunities in Saudi Arabia",
      intro: "Browse modeling jobs, commercial shoots and projects looking for models across Saudi Arabia, with clear opportunity details before you apply.",
      secondaryTitle: "Looking for modeling jobs or commercial shoots?",
      secondaryBody: "Browse published modeling and photo shoot opportunities on MLAMH and apply to relevant projects using your professional profile.",
    },
  },
} as const;

type TypeKey = keyof typeof TYPES;

function resolveType(value: string): TypeKey | null {
  return value === "acting" || value === "modeling" ? value : null;
}

export async function generateMetadata({ params }: { params: Promise<{ locale?: string; type: string }> }): Promise<Metadata> {
  const { locale: rawLocale, type: rawType } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const type = resolveType(rawType);
  if (!type) return { robots: { index: false, follow: false } };
  const copy = TYPES[type][locale];
  const canonical = `${SITE_URL}/${locale}/opportunities/type/${type}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/opportunities/type/${type}`,
        en: `${SITE_URL}/en/opportunities/type/${type}`,
        "x-default": `${SITE_URL}/ar/opportunities/type/${type}`,
      },
    },
    openGraph: { title: copy.title, description: copy.description, url: canonical, siteName: "MLAMH", type: "website" },
  };
}

export default async function OpportunityTypePage({ params }: { params: Promise<{ locale?: string; type: string }> }) {
  const { locale: rawLocale, type: rawType } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const type = resolveType(rawType);
  if (!type) notFound();

  const config = TYPES[type];
  const copy = config[locale];
  const opportunities = await getPublishedOpportunities().catch(() => []);
  const matches = opportunities.filter((item) => config.accepted.has(String(item.opportunity_type) as never));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: isArabic ? "ملامح" : "MLAMH", item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: isArabic ? "الفرص" : "Opportunities", item: `${SITE_URL}/${locale}/opportunities` },
      { "@type": "ListItem", position: 3, name: copy.h1, item: `${SITE_URL}/${locale}/opportunities/type/${type}` },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8" dir={isArabic ? "rtl" : "ltr"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
        <Link href={`/${locale}/opportunities`} className="hover:text-zinc-900">{isArabic ? "الفرص" : "Opportunities"}</Link>
        <span className="mx-2">/</span><span>{copy.h1}</span>
      </nav>
      <section className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{copy.h1}</h1>
        <p className="mt-4 text-base leading-8 text-zinc-600">{copy.intro}</p>
      </section>
      {matches.length > 0 ? (
        <section>
          <h2 className="mb-5 text-xl font-semibold text-zinc-950">{isArabic ? `الفرص المتاحة (${matches.length})` : `Available opportunities (${matches.length})`}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((item) => {
              const city = isArabic ? item.city_ar || item.city_en : item.city_en || item.city_ar;
              const title = isArabic ? item.title : item.title_en || item.title;
              return (
                <Link key={item.id} href={`/${locale}/opportunities/${item.slug}`} className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400">
                  <h3 className="font-semibold text-zinc-950">{title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{city || (isArabic ? "السعودية" : "Saudi Arabia")}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="font-semibold text-zinc-950">{isArabic ? "لا توجد فرص منشورة من هذا النوع حاليًا" : "No opportunities of this type are published right now"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{isArabic ? "تصفح جميع الفرص المنشورة حاليًا، وتحقق مرة أخرى عند إضافة فرص جديدة." : "Browse all currently published opportunities and check back as new opportunities are added."}</p>
          <Link href={`/${locale}/opportunities`} className="mt-4 inline-block font-medium underline">{isArabic ? "عرض جميع الفرص" : "View all opportunities"}</Link>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-zinc-950">{copy.secondaryTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">{copy.secondaryBody}</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
          <Link href={`/${locale}/talent/category/${type === "acting" ? "actor" : "model"}`} className="underline underline-offset-4">
            {type === "acting" ? (isArabic ? "استعرض الممثلين في السعودية" : "Browse actors in Saudi Arabia") : (isArabic ? "استعرض مودلز في السعودية" : "Browse models in Saudi Arabia")}
          </Link>
          <Link href={`/${locale}/guides/${type === "acting" ? "casting-auditions-saudi-arabia" : "how-to-start-modeling-saudi-arabia"}`} className="underline underline-offset-4">
            {type === "acting" ? (isArabic ? "دليل الكاستينج وتجارب الأداء" : "Casting and auditions guide") : (isArabic ? "دليل البدء كمودل" : "How to start modeling")}
          </Link>
        </div>
      </section>
    </main>
  );
}
