import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clapperboard,
  Search,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

export function Agencies({ locale }: { locale: Locale }) {
  const isRtl = locale === "ar";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const features = isRtl
    ? [
        {
          icon: Search,
          number: "01",
          title: "اكتشاف أسرع",
          body: "استكشف المواهب حسب التخصص والمدينة والحضور البصري، ووصل إلى الملفات المناسبة لمشروعك بسرعة.",
        },
        {
          icon: UsersRound,
          number: "02",
          title: "ملفات مهنية واضحة",
          body: "راجع الصور، المعلومات المهنية، معرض الأعمال والبيانات الأساسية قبل اتخاذ قرارك.",
        },
        {
          icon: Send,
          number: "03",
          title: "طلبات كاست مباشرة",
          body: "أرسل طلبات الكاست للموهبة المناسبة، واحتفظ بمسار المشروع والطلبات داخل ملامح.",
        },
      ]
    : [
        {
          icon: Search,
          number: "01",
          title: "Faster Discovery",
          body: "Discover talent by specialty, city, and visual presence, then reach the right profiles faster.",
        },
        {
          icon: UsersRound,
          number: "02",
          title: "Clear Professional Profiles",
          body: "Review images, professional information, portfolios, and key details before making a decision.",
        },
        {
          icon: Send,
          number: "03",
          title: "Direct Casting Requests",
          body: "Send casting requests to suitable talent and keep your project workflow organized inside MLAMH.",
        },
      ];

  const industries = isRtl
    ? [
        {
          icon: Sparkles,
          title: "وكالات الإعلان",
          subtitle: "Ad Agencies",
        },
        {
          icon: Clapperboard,
          title: "شركات الإنتاج",
          subtitle: "Production",
        },
        {
          icon: BriefcaseBusiness,
          title: "مديرو الكاست",
          subtitle: "Casting",
        },
        {
          icon: Building2,
          title: "العلامات التجارية",
          subtitle: "Brands",
        },
      ]
    : [
        {
          icon: Sparkles,
          title: "Ad Agencies",
          subtitle: "Creative Agencies",
        },
        {
          icon: Clapperboard,
          title: "Production Companies",
          subtitle: "Production",
        },
        {
          icon: BriefcaseBusiness,
          title: "Casting Directors",
          subtitle: "Casting",
        },
        {
          icon: Building2,
          title: "Brands",
          subtitle: "Commercial",
        },
      ];

  return (
    <section
      id="agencies"
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden border-y border-white/[0.06] bg-black px-6 py-20 text-white md:py-24 lg:py-28"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[12%] top-0 h-[520px] w-[520px] rounded-full bg-gold/[0.07] blur-[150px]" />

        <div className="absolute -bottom-32 left-[5%] h-[420px] w-[420px] rounded-full bg-white/[0.025] blur-[120px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_15%,rgba(201,159,94,0.08),transparent_34%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Mobile */}
<div className="lg:hidden">
  <div className="mb-6">
    <p className="text-xs text-gold">
      {isRtl ? "جهات موثوقة" : "Trusted Organizations"}
    </p>

    <h2
      className="mt-2 text-2xl font-light text-white"
      style={{ fontFamily: displayFont }}
    >
      {isRtl ? "جهات وصنّاع مشاريع" : "Industry Teams"}
    </h2>

    <p
      className="mt-3 text-sm leading-7 text-white/45"
      style={{ fontFamily: bodyFont }}
    >
      {isRtl
        ? "اكتشف الجهات التي تبحث عن المواهب وتعمل في الإعلان والإنتاج والكاست والعلامات التجارية."
        : "Discover organizations looking for talent across advertising, production, casting, and brands."}
    </p>
  </div>

  <div className="grid gap-3">
    {industries.map((industry) => {
      const Icon = industry.icon;

      return (
        <div
          key={industry.title}
          className="flex min-h-24 items-center gap-4 rounded-[1.6rem] border border-white/[0.08] bg-white/[0.03] px-5 py-4"
        >
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.06] text-gold">
            <Icon size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-base text-white">
              {industry.title}
            </p>

            <p className="mt-1 text-xs text-white/30">
              {industry.subtitle}
            </p>
          </div>
        </div>
      );
    })}
  </div>

  <Link
    href={`/${locale}/publishers`}
    className="mt-5 flex min-h-14 items-center justify-between rounded-2xl border border-gold/25 bg-gold/[0.06] px-5 text-sm text-gold"
  >
    <span>
      {isRtl ? "استكشف جميع الجهات" : "Explore Organizations"}
    </span>

    <ArrowUpRight size={17} />
  </Link>
</div>
<div className="hidden lg:block">
        {/* Section heading */}
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p
              className={[
                "mb-4 text-[10px] text-gold",
                isRtl
                  ? "tracking-normal"
                  : "uppercase tracking-[0.38em]",
              ].join(" ")}
            >
              {isRtl ? "للجهات وصنّاع المشاريع" : "For Industry Teams"}
            </p>

            <h2
              className={[
                "text-4xl font-light leading-[1.15] text-white md:text-6xl lg:text-7xl",
                isRtl ? "tracking-normal" : "tracking-tight",
              ].join(" ")}
              style={{ fontFamily: displayFont }}
            >
              {isRtl
                ? "اعثر على الموهبة التي يحتاجها مشروعك."
                : "Find the talent your project needs."}
            </h2>

            <p
              className="mt-6 max-w-3xl text-sm leading-8 text-white/50 md:text-base"
              style={{ fontFamily: bodyFont }}
            >
              {isRtl
                ? "من البحث الأول إلى مراجعة الملف وإرسال طلب الكاست، ملامح تجمع رحلة اكتشاف المواهب في تجربة واحدة واضحة."
                : "From discovery to profile review and casting requests, MLAMH brings the talent workflow into one clear experience."}
            </p>
          </div>

          <Link
            href={talentPath(locale)}
            className={[
              "inline-flex w-fit items-center justify-center gap-3 rounded-full border border-gold/35 bg-gold/[0.07] px-6 py-3 text-[10px] text-gold transition hover:bg-gold hover:text-black",
              isRtl
                ? "tracking-normal"
                : "uppercase tracking-[0.25em]",
            ].join(" ")}
          >
            {isRtl ? "استكشف المواهب" : "Explore Talent"}

            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Main layout */}
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Primary industry card */}
          <article className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.055] via-white/[0.025] to-transparent p-7 md:p-10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/[0.08] blur-[90px]" />
            </div>

            <div className="relative flex h-full min-h-[500px] flex-col justify-between">
              <div>
                <div className="mb-8 flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-2 text-[10px] text-gold">
                    <BadgeCheck size={14} />

                    {isRtl
                      ? "اكتشاف مواهب احترافي"
                      : "Professional Talent Discovery"}
                  </span>

                  <span className="text-[10px] text-white/25">
                    MLAMH / INDUSTRY
                  </span>
                </div>

                <h3
                  className="max-w-3xl text-4xl font-light leading-[1.2] text-white md:text-5xl"
                  style={{ fontFamily: displayFont }}
                >
                  {isRtl
                    ? "من البحث إلى الاختيار، كل ما تحتاجه في مكان واحد."
                    : "From search to selection, everything in one place."}
                </h3>

                <p
                  className="mt-6 max-w-2xl text-sm leading-8 text-white/50 md:text-base"
                  style={{ fontFamily: bodyFont }}
                >
                  {isRtl
                    ? "ابحث عن ممثل أو مودل، راجع ملفه وصوره وأعماله، ثم أرسل طلب الكاست مباشرة دون فقدان تفاصيل المشروع بين المحادثات والمنصات المختلفة."
                    : "Find actors or models, review their profiles, images and portfolio, then send casting requests without losing project details across different channels."}
                </p>
              </div>

              <div className="mt-12">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={talentPath(locale)}
                    className="group flex min-h-20 items-center justify-between rounded-2xl border border-gold/25 bg-gold/[0.07] px-5 transition hover:border-gold/50 hover:bg-gold/[0.11]"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {isRtl
                          ? "ابدأ البحث عن موهبة"
                          : "Start Talent Search"}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {isRtl
                          ? "اكتشف الملفات المنشورة"
                          : "Browse published profiles"}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-gold transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>

                  <Link
                    href={`/${locale}/join?type=publisher`}
                    className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-5 transition hover:border-gold/30 hover:bg-white/[0.04]"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {isRtl
                          ? "سجل كجهة"
                          : "Join as an Organization"}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {isRtl
                          ? "انشر فرصك وأدر طلباتك"
                          : "Publish and manage opportunities"}
                      </p>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-white/35 transition group-hover:text-gold"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </article>

          {/* Feature cards */}
          <div className="grid gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.number}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.03] p-6 transition duration-500 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.045] md:p-7"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold">
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] text-gold/70">
                          {feature.number}
                        </span>
                      </div>

                      <h3
                        className="text-2xl font-light text-white"
                        style={{ fontFamily: displayFont }}
                      >
                        {feature.title}
                      </h3>

                      <p
                        className="mt-3 text-sm leading-7 text-white/45"
                        style={{ fontFamily: bodyFont }}
                      >
                        {feature.body}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Industry types */}
        <div className="mt-16 border-t border-white/[0.07] pt-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-xs text-white/35">
              {isRtl
                ? "مصممة لفرق الصناعة الإبداعية"
                : "Built for creative industry teams"}
            </p>

            <div className="hidden h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-transparent md:block" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => {
              const Icon = industry.icon;

              return (
                <div
                  key={industry.title}
                  className="group flex min-h-28 items-center gap-4 rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] px-5 transition hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.045]"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.05] text-gold">
                    <Icon size={18} />
                  </span>

                  <div>
                    <p className="text-sm text-white transition group-hover:text-gold">
                      {industry.title}
                    </p>

                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/25">
                      {industry.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
      </div>

      </div>
    </section>
  );
}