import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { isValidLocale, type Locale } from "@/lib/i18n";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mlamh.net").replace(/\/$/, "");

const guides = [
  {
    slug: "how-to-start-acting-saudi-arabia",
    ar: {
      title: "كيف تبدأ التمثيل في السعودية؟",
      description: "دليل عملي للمبتدئين لتجهيز ملف الممثل والصور وفيديو التعريف ومتابعة فرص التمثيل والكاستينج.",
      keyword: "كيف تصبح ممثلًا في السعودية",
    },
    en: {
      title: "How to Start Acting in Saudi Arabia",
      description: "A practical beginner guide to actor profiles, photos, introductions and finding acting and casting opportunities.",
      keyword: "how to become an actor in Saudi Arabia",
    },
  },
  {
    slug: "how-to-start-modeling-saudi-arabia",
    ar: {
      title: "كيف تبدأ كمودل في السعودية؟",
      description: "تعرف على أساسيات ملف المودل والصور والقياسات وطريقة الوصول إلى فرص التصوير والإعلانات.",
      keyword: "كيف تصبح مودل في السعودية",
    },
    en: {
      title: "How to Start Modeling in Saudi Arabia",
      description: "Learn the basics of a model profile, photos, measurements and finding modeling and advertising opportunities.",
      keyword: "how to become a model in Saudi Arabia",
    },
  },
  {
    slug: "casting-auditions-saudi-arabia",
    ar: {
      title: "تجارب الأداء والكاستينج في السعودية",
      description: "كيف تستعد لتجربة الأداء وتفهم متطلبات الكاستينج وتقدم على فرص التمثيل بطريقة احترافية.",
      keyword: "تجارب أداء في السعودية",
    },
    en: {
      title: "Casting Auditions in Saudi Arabia",
      description: "How to prepare for auditions, understand casting requirements and apply professionally for acting opportunities.",
      keyword: "casting auditions Saudi Arabia",
    },
  },
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) return {};
  const locale = rawLocale as Locale;
  const isArabic = locale === "ar";
  const title = isArabic
    ? "دليل التمثيل والمودل والكاستينج في السعودية | ملامح"
    : "Acting, Modeling & Casting Guides in Saudi Arabia | MLAMH";
  const description = isArabic
    ? "أدلة عملية للممثلين والمودلز والمواهب في السعودية: بداية التمثيل، بداية المودل، تجارب الأداء، الكاستينج وفرص التصوير والإعلانات."
    : "Practical guides for actors, models and talents in Saudi Arabia covering acting, modeling, auditions, casting and advertising opportunities.";
  const canonical = `${SITE_URL}/${locale}/guides`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "ar-SA": `${SITE_URL}/ar/guides`,
        en: `${SITE_URL}/en/guides`,
        "x-default": `${SITE_URL}/ar/guides`,
      },
    },
    openGraph: { title, description, url: canonical, siteName: "MLAMH", type: "website" },
  };
}

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const isArabic = locale === "ar";

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background text-white">
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <header className="max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">{isArabic ? "أدلة ملامح" : "MLAMH GUIDES"}</p>
          <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
            {isArabic ? "دليل التمثيل والمودل والكاستينج في السعودية" : "Acting, Modeling & Casting Guides in Saudi Arabia"}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-white/55 sm:text-base">
            {isArabic
              ? "محتوى عملي يساعد المواهب على تجهيز ملفاتها، فهم تجارب الأداء والكاستينج، والوصول إلى فرص التمثيل والمودل والتصوير في السعودية."
              : "Practical resources to help talents build stronger profiles, understand auditions and casting, and find acting, modeling and advertising opportunities in Saudi Arabia."}
          </p>
        </header>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {guides.map((guide) => {
            const copy = guide[locale];
            return (
              <Link key={guide.slug} href={`/${locale}/guides/${guide.slug}`} className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-gold/30 hover:bg-gold/[0.04]">
                <p className="text-xs text-gold">{copy.keyword}</p>
                <h2 className="mt-3 text-xl font-medium leading-8">{copy.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/50">{copy.description}</p>
                <span className="mt-6 inline-flex text-sm text-gold">{isArabic ? "اقرأ الدليل ←" : "Read guide →"}</span>
              </Link>
            );
          })}
        </section>

        <nav aria-label={isArabic ? "روابط ذات صلة" : "Related links"} className="mt-12 flex flex-wrap gap-3">
          <Link href={`/${locale}/opportunities/type/acting`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65 hover:border-gold/30 hover:text-gold">{isArabic ? "فرص تمثيل وكاستينج" : "Acting & casting opportunities"}</Link>
          <Link href={`/${locale}/opportunities/type/modeling`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65 hover:border-gold/30 hover:text-gold">{isArabic ? "فرص مودل وتصوير" : "Modeling opportunities"}</Link>
          <Link href={`/${locale}/talent`} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/65 hover:border-gold/30 hover:text-gold">{isArabic ? "دليل الممثلين والمودلز" : "Actors & models directory"}</Link>
        </nav>
      </section>
      <Footer locale={locale} />
    </main>
  );
}
