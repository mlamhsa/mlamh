import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Agencies } from "@/components/Agencies";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { ModelsShowcase } from "@/components/ModelsShowcase";
import { Opportunities } from "@/components/Opportunities";
import { ValueProps } from "@/components/ValueProps";

import { HomepageCMS } from "@/lib/cms/HomepageCMS";
import { ValuePropsCMS } from "@/lib/cms/ValuePropsCMS";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getTalents } from "@/lib/supabase/talents";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const [talents, hero, valueProps] = await Promise.all([
    getTalents(),
    HomepageCMS.getPublicHero(locale),
    ValuePropsCMS.getPublicValueProps(locale),
  ]);

  const quickActions = [
    {
      key: "talents",
      title: isArabic ? "استكشف المواهب" : "Explore talents",
      description: isArabic
        ? "اكتشف الوجوه والخبرات المناسبة"
        : "Discover suitable faces and expertise",
      href: `/${locale}/talent`,
      icon: UsersRound,
    },
    {
      key: "opportunities",
      title: isArabic ? "تصفح الفرص" : "Browse opportunities",
      description: isArabic
        ? "اعثر على فرص جديدة تناسبك"
        : "Find new opportunities that suit you",
      href: `/${locale}/opportunities`,
      icon: BriefcaseBusiness,
    },
    {
      key: "companies",
      title: isArabic ? "الشركات" : "Companies",
      description: isArabic
        ? "تعرف على الجهات الناشرة"
        : "Discover publishing organisations",
      href: `/${locale}/publishers`,
      icon: Building2,
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="relative z-[2] min-h-screen bg-background"
    >
      {/* Mobile application home */}
      <div className="lg:hidden">
        <section className="px-4 pb-7 pt-5">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-5 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                  <Sparkles size={14} />
                  <span>
                    {isArabic ? "منصة المواهب الإبداعية" : "Creative talent platform"}
                  </span>
                </div>

                <h1 className="max-w-xs text-3xl font-semibold leading-tight text-white">
                  {isArabic
                    ? "اكتشف فرصتك القادمة"
                    : "Discover your next opportunity"}
                </h1>

                <p className="mt-3 max-w-sm text-sm leading-7 text-white/55">
                  {isArabic
                    ? "تصفح المواهب والفرص والشركات من مكان واحد."
                    : "Browse talents, opportunities and companies in one place."}
                </p>
              </div>
            </div>

            <Link
              href={`/${locale}/talent`}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 text-white/45 transition active:scale-[0.99] active:bg-white/[0.06]"
            >
              <Search size={20} className="shrink-0 text-gold" />

              <span className="flex-1 text-sm">
                {isArabic
                  ? "ابحث عن موهبة أو تخصص..."
                  : "Search for talent or expertise..."}
              </span>

              <DirectionArrow size={17} />
            </Link>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gold">
                {isArabic ? "وصول سريع" : "Quick access"}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                {isArabic ? "ماذا تبحث عنه؟" : "What are you looking for?"}
              </h2>
            </div>
          </div>

          <div className="grid gap-3">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex min-h-24 items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 transition active:scale-[0.99] active:bg-white/[0.07]"
                >
                  <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold">
                    <Icon size={24} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-white">
                      {item.title}
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-white/45">
                      {item.description}
                    </span>
                  </span>

                  <DirectionArrow
                    size={19}
                    className="shrink-0 text-white/35"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden pb-8">
          <div className="mb-4 flex items-end justify-between px-4">
            <div>
              <p className="text-xs text-gold">
                {isArabic ? "مختارات ملامح" : "MLAMH selections"}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                {isArabic ? "مواهب تستحق الاكتشاف" : "Talents to discover"}
              </h2>
            </div>

            <Link
              href={`/${locale}/talent`}
              className="inline-flex items-center gap-1 text-xs text-white/50"
            >
              <span>{isArabic ? "عرض الكل" : "View all"}</span>
              <DirectionArrow size={14} />
            </Link>
          </div>

          <ModelsShowcase locale={locale} talents={talents} />
        </section>

        <section className="overflow-hidden pb-8">
          <div className="mb-4 flex items-end justify-between px-4">
            <div>
              <p className="text-xs text-gold">
                {isArabic ? "فرص جديدة" : "New opportunities"}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                {isArabic ? "ابدأ خطوتك التالية" : "Take your next step"}
              </h2>
            </div>

            <Link
              href={`/${locale}/opportunities`}
              className="inline-flex items-center gap-1 text-xs text-white/50"
            >
              <span>{isArabic ? "عرض الكل" : "View all"}</span>
              <DirectionArrow size={14} />
            </Link>
          </div>

          <Opportunities locale={locale} />
        </section>

        <section className="overflow-hidden pb-8">
          <div className="mb-4 px-4">
            <p className="text-xs text-gold">
              {isArabic ? "جهات موثوقة" : "Trusted organisations"}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {isArabic ? "شركات ووكالات" : "Companies and agencies"}
            </h2>
          </div>

          <Agencies locale={locale} />
        </section>

        <div className="pb-6">
          <FinalCTA locale={locale} />
        </div>

        <Footer locale={locale} />
      </div>

      {/* Existing desktop website */}
      <div className="hidden lg:block">
        <Hero locale={locale} data={hero} />

        <ValueProps locale={locale} data={valueProps} />

        <HowItWorks locale={locale} />

        <ModelsShowcase locale={locale} talents={talents} />

        <Opportunities locale={locale} />

        <Agencies locale={locale} />

        <FinalCTA locale={locale} />

        <Footer locale={locale} />
      </div>
    </main>
  );
}