import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, Building2, Sparkles, UserRound } from "lucide-react";

import type { Locale } from "@/lib/i18n";

export function SceneHomeEntry({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const paths = [
    {
      icon: UserRound,
      label: isArabic ? "للمواهب" : "For talent",
      text: isArabic ? "ملفك، صورك، الكاستينغ ومسارك المهني" : "Your profile, media, casting and career",
      href: `/${locale}/scene/category/talent`,
    },
    {
      icon: Building2,
      label: isArabic ? "للناشرين" : "For publishers",
      text: isArabic ? "الطلبات، الاختيار وإدارة المواهب" : "Briefs, selection and talent workflow",
      href: `/${locale}/scene/category/publishers`,
    },
    {
      icon: BookOpenText,
      label: isArabic ? "استخدام ملامح" : "Using MLAMH",
      text: isArabic ? "شروحات عملية لكل خطوة داخل المنصة" : "Practical help for every step in the platform",
      href: `/${locale}/scene/category/using-mlamh`,
    },
  ];

  return (
    <section dir={isArabic ? "rtl" : "ltr"} className="border-y border-white/[0.07] bg-black px-4 py-12 text-white sm:px-6 md:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              MLAMH SCENE
            </div>
            <h2 className="mt-4 text-3xl font-light leading-tight sm:text-4xl lg:text-5xl">
              {isArabic ? "ادخل مشهد ملامح" : "Enter MLAMH Scene"}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-8 text-white/50 sm:text-base">
              {isArabic
                ? "مساحة داخل ملامح تجمع المعرفة العملية، شروحات المنصة، الكاستينغ وصناعة المواهب في مكان واحد."
                : "A space inside MLAMH for practical knowledge, platform guidance, casting and the talent industry."}
            </p>
            <Link
              href={`/${locale}/scene`}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-medium text-black transition hover:bg-gold-soft"
            >
              {isArabic ? "استكشف المشهد" : "Explore the Scene"}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {paths.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-[1.35rem] border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-gold/20 hover:bg-white/[0.045]"
                >
                  <Icon className="h-5 w-5 text-gold" />
                  <h3 className="mt-5 text-base font-medium">{item.label}</h3>
                  <p className="mt-2 text-xs leading-6 text-white/40">{item.text}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] text-gold/70 transition group-hover:text-gold">
                    {isArabic ? "ابدأ من هنا" : "Start here"}
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
