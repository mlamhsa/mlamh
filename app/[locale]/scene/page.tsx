import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Building2,
  Clapperboard,
  Compass,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import { SceneArticleCard } from "@/components/scene/SceneArticleCard";
import { SceneCMS } from "@/lib/cms/SceneCMS";
import type { ScenePublicArticle, ScenePublicCategory } from "@/lib/types/scene";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

const SITE_URL = "https://mlamh.net";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const title = isArabic
    ? "مشهد ملامح | أدلة وقصص ومعرفة للمواهب والناشرين"
    : "MLAMH Scene | Guides, Stories & Industry Knowledge";
  const description = isArabic
    ? "مساحتك لفهم المواهب والكاستنج وصناعة الإبداع، مع أدلة عملية لاستخدام ملامح وتطوير حضورك المهني."
    : "A practical hub for talent, casting, the creative industry, and getting more from MLAMH.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/scene`,
      languages: {
        ar: `${SITE_URL}/ar/scene`,
        en: `${SITE_URL}/en/scene`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}/scene`,
      siteName: "MLAMH",
      type: "website",
      locale: isArabic ? "ar_SA" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  talent: UserRound,
  publishers: Building2,
  industry: Clapperboard,
  "using-mlamh": Compass,
  stories: Sparkles,
  reports: BookOpenText,
};

function categoryFallback(slug: string, isArabic: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    talent: { ar: "ابنِ حضورًا مهنيًا أقوى واستعد للفرص والكاستنج.", en: "Build a stronger professional presence and get casting-ready." },
    publishers: { ar: "من كتابة الطلب إلى اختيار الموهبة وإدارة التواصل.", en: "From writing the brief to selecting talent and managing communication." },
    industry: { ar: "افهم الكاستنج والإنتاج والتصوير وما يتحرك في السوق.", en: "Understand casting, production, photography and market movement." },
    "using-mlamh": { ar: "شروحات مباشرة لكل ما تحتاجه داخل منصة ملامح.", en: "Straightforward guidance for everything you do inside MLAMH." },
    stories: { ar: "تجارب ووجوه وكواليس من داخل الصناعة الإبداعية.", en: "People, experiences and behind-the-scenes stories from the industry." },
    reports: { ar: "بيانات ورؤى تساعدك على قراءة سوق المواهب والكاستنج.", en: "Data and insights for understanding talent and casting markets." },
  };
  return labels[slug]?.[isArabic ? "ar" : "en"] ?? "";
}

export default async function SceneHomePage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";

  let categories: ScenePublicCategory[] = [];
  let articles: ScenePublicArticle[] = [];

  try {
    [categories, articles] = await Promise.all([
      SceneCMS.getPublicCategories(locale),
      SceneCMS.getPublicArticles({ locale, limit: 30 }),
    ]);
  } catch (error) {
    console.error("[SceneHomePage]", error);
  }

  const featured = articles.filter((article) => article.isFeatured);
  const lead = featured[0] ?? articles[0] ?? null;
  const latest = articles.filter((article) => article.id !== lead?.id).slice(0, 6);
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(212,175,55,0.15),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(255,255,255,0.06),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-gold/80">
            <Sparkles className="h-3.5 w-3.5" />
            MLAMH SCENE
          </div>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-light leading-[1.25] sm:text-5xl md:text-6xl lg:text-7xl">
                {isArabic ? "مشهد ملامح" : "MLAMH Scene"}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-9 text-white/60 sm:text-xl">
                {isArabic
                  ? "ادخل المشهد. افهم الصناعة، طوّر حضورك، واتخذ قرارات أفضل في المواهب والكاستنج."
                  : "Enter the scene. Understand the industry, sharpen your presence, and make better talent and casting decisions."}
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/35">
                {isArabic
                  ? "أدلة عملية، شروحات ملامح، قصص، مقابلات وتقارير — في مساحة واحدة داخل المنصة."
                  : "Practical guides, MLAMH help, stories, interviews and reports — all inside the platform."}
              </p>

              <form action={`/${locale}/scene/search`} method="get" className="mt-7 flex max-w-2xl gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2 backdrop-blur-sm">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="search"
                    name="q"
                    maxLength={80}
                    autoComplete="off"
                    placeholder={isArabic ? "ابحث في مشهد ملامح..." : "Search MLAMH Scene..."}
                    className="h-12 w-full rounded-xl bg-black/35 ps-11 pe-4 text-sm text-white outline-none placeholder:text-white/25 focus:ring-1 focus:ring-gold/30"
                  />
                </div>
                <button type="submit" className="h-12 rounded-xl bg-gold px-5 text-sm font-medium text-black transition hover:bg-gold-soft">
                  {isArabic ? "بحث" : "Search"}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { icon: UserRound, label: isArabic ? "أنا موهبة" : "I'm talent", text: isArabic ? "ملف، صور، كاستنج" : "Profile, media, casting" },
                { icon: Building2, label: isArabic ? "أنا ناشر" : "I'm a publisher", text: isArabic ? "طلبات، اختيار، إدارة" : "Briefs, selection, workflow" },
                { icon: Clapperboard, label: isArabic ? "الصناعة" : "Industry", text: isArabic ? "كاستنج وإنتاج" : "Casting & production" },
                { icon: Compass, label: isArabic ? "استخدام ملامح" : "Using MLAMH", text: isArabic ? "شروحات واضحة" : "Clear how-to guides" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm sm:p-5">
                  <item.icon className="h-5 w-5 text-gold" />
                  <p className="mt-4 text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-[11px] text-white/35">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {lead ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{isArabic ? "من المشهد" : "FROM THE SCENE"}</p>
              <h2 className="mt-2 text-2xl font-light sm:text-3xl">{isArabic ? "مختارات ملامح" : "MLAMH selections"}</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
            <SceneArticleCard article={lead} locale={locale} priority />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {latest.slice(0, 2).map((article) => (
                <SceneArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-y border-white/[0.07] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{isArabic ? "ابدأ من هنا" : "START HERE"}</p>
            <h2 className="mt-2 text-2xl font-light sm:text-3xl">{isArabic ? "اختر ما يهمك" : "Choose what matters to you"}</h2>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] ?? BookOpenText;
              const count = articles.filter((article) => article.categoryId === category.id).length;
              return (
                <Link
                  key={category.id}
                  href={`/${locale}/scene/category/${category.slug}`}
                  className="group rounded-[1.5rem] border border-white/10 bg-black/25 p-5 transition hover:-translate-y-0.5 hover:border-gold/20 hover:bg-white/[0.03] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/15 bg-gold/[0.05] text-gold"><Icon className="h-5 w-5" /></span>
                    <span className="text-[10px] text-white/25">{count > 0 ? `${count}` : isArabic ? "قريبًا" : "Soon"}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-medium">{category.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/40">{category.description || categoryFallback(category.slug, isArabic)}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs text-gold/75 transition group-hover:text-gold">
                    {isArabic ? "استكشف القسم" : "Explore category"}
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {latest.length > 2 ? (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{isArabic ? "الجديد" : "LATEST"}</p>
              <h2 className="mt-2 text-2xl font-light sm:text-3xl">{isArabic ? "أحدث ما في المشهد" : "Latest from the scene"}</h2>
            </div>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latest.slice(2).map((article) => (
              <SceneArticleCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {articles.length === 0 ? (
        <section className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 md:py-20">
          <BookOpenText className="mx-auto h-8 w-8 text-gold/70" />
          <h2 className="mt-5 text-2xl font-light sm:text-3xl">{isArabic ? "المشهد يُبنى الآن" : "The Scene is being built"}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/40">
            {isArabic
              ? "نعمل على أول مجموعة من الأدلة والشروحات والقصص. ستظهر هنا تباعًا بدون التأثير على خدمات ملامح الحالية."
              : "The first set of guides, explainers and stories is being prepared and will appear here progressively."}
          </p>
          <Link href={`/${locale}`} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold">
            {isArabic ? "العودة إلى ملامح" : "Back to MLAMH"}
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </section>
      ) : null}
    </main>
  );
}
