"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useParams } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import type { PublicHomepageHero } from "@/lib/types/homepage";

type HeroProps = {
  locale?: Locale;
  data: PublicHomepageHero;
};

const HERO_IMAGES = {
  actor: "/images/home/hero-actor.webp",
  model: "/images/home/hero-model.webp",
  production: "/images/home/production-set.webp",
  saudi: "/images/home/55.jpg",
};

export function Hero({
  locale: propLocale,
  data,
}: HeroProps) {
  const params = useParams();

  const locale =
    propLocale ||
    (params?.locale as Locale) ||
    "ar";

  const isAr = locale === "ar";
  const DirectionArrow = isAr
    ? ArrowLeft
    : ArrowRight;

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative isolate overflow-hidden border-b border-white/[0.07] bg-black text-white"
    >
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 bg-black"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_58%_12%,rgba(200,169,106,0.14),transparent_34%),radial-gradient(circle_at_18%_65%,rgba(200,169,106,0.08),transparent_28%)]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-black via-black/70 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-[1520px] items-center gap-12 px-6 pb-14 pt-14 lg:min-h-[calc(100vh-84px)] lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pb-16 lg:pt-16 xl:gap-16 xl:px-16">
        {/* Content */}
        <div
          className={[
            "relative z-20",
            isAr
              ? "text-right"
              : "text-left",
          ].join(" ")}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-4 py-2 text-[11px] text-gold backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>

            <span>
              {data.eyebrow ||
                (isAr
                  ? "منصة المواهب والفرص الإبداعية"
                  : "Talent & creative opportunities")}
            </span>
          </div>

          <h1
            className={[
              "max-w-[780px] text-[clamp(3.15rem,5.15vw,5.75rem)] font-medium leading-[1.04]",
              isAr
                ? "tracking-normal"
                : "tracking-[-0.045em]",
            ].join(" ")}
          >
            {data.titleLine1}

            {data.titleLine2 ? (
              <span className="mt-2 block text-gold">
                {data.titleLine2}
              </span>
            ) : null}
          </h1>

          {data.description ? (
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/55 lg:text-[17px] lg:leading-9">
              {data.description}
            </p>
          ) : null}

          {/* Search */}
          <Link
            href={`/${locale}/talent`}
            className="group mt-8 flex min-h-[66px] max-w-[650px] items-center gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-300 hover:border-gold/35 hover:bg-white/[0.07]"
          >
            <Search
              size={21}
              className="shrink-0 text-gold"
            />

            <span className="min-w-0 flex-1 text-sm text-white/42">
              {isAr
                ? "ابحث عن ممثل، مودل أو موهبة..."
                : "Search actors, models or talent..."}
            </span>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/40 transition group-hover:border-gold/30 group-hover:text-gold">
              <DirectionArrow size={16} />
            </span>
          </Link>

          {/* CTAs */}
          <div className="mt-5 flex flex-wrap gap-3">
            {data.primaryCtaLabel ? (
              <Link
                href={data.primaryCtaHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-7 text-sm font-semibold text-black transition duration-300 hover:bg-[#e0bd73]"
              >
                <UsersRound size={17} />
                {data.primaryCtaLabel}
              </Link>
            ) : null}

            {data.secondaryCtaLabel ? (
              <Link
                href={data.secondaryCtaHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.025] px-7 text-sm text-white/75 transition duration-300 hover:border-gold/35 hover:text-gold"
              >
                <BriefcaseBusiness size={17} />
                {data.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>

          {/* Supporting line */}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/35">
            <span className="inline-flex items-center gap-2">
              <Sparkles
                size={14}
                className="text-gold"
              />
              {isAr
                ? "ملفات مواهب احترافية"
                : "Professional talent profiles"}
            </span>

            <span className="inline-flex items-center gap-2">
              <BriefcaseBusiness
                size={14}
                className="text-gold"
              />
              {isAr
                ? "فرص ومشاريع كاستينغ"
                : "Casting opportunities & projects"}
            </span>
          </div>
        </div>

        {/* Editorial visual */}
        <div className="relative hidden lg:block">
          <div className="mx-auto max-w-[650px]">
            {/* Images */}
            <div className="relative">
              <div className="grid h-[610px] grid-cols-[1.12fr_0.88fr] grid-rows-2 gap-4">
                {/* Main actor */}
                <div className="group relative row-span-2 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0b0b0b] shadow-[0_35px_100px_rgba(0,0,0,0.45)]">
                  <Image
                    src={HERO_IMAGES.actor}
                    alt={
                      isAr
                        ? "ممثل على منصة ملامح"
                        : "Actor on MLAMH"
                    }
                    fill
                    priority
                    sizes="(min-width: 1280px) 28vw, 32vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-[1.025]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="inline-flex rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] text-white/70 backdrop-blur-lg">
                      {isAr
                        ? "ممثل"
                        : "ACTOR"}
                    </span>

                    <p className="mt-3 max-w-[250px] text-lg font-medium leading-7 text-white">
                      {isAr
                        ? "وجوه جديدة تستحق فرصتها القادمة."
                        : "New faces ready for their next opportunity."}
                    </p>
                  </div>
                </div>

                {/* Model */}
                <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b] shadow-2xl">
                  <Image
                    src={HERO_IMAGES.model}
                    alt={
                      isAr
                        ? "مودل على منصة ملامح"
                        : "Model on MLAMH"
                    }
                    fill
                    priority
                    sizes="(min-width: 1280px) 18vw, 20vw"
                    className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <span className="absolute bottom-4 end-4 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[10px] text-white/75 backdrop-blur-lg">
                    {isAr ? "مودل" : "MODEL"}
                  </span>
                </div>

                {/* Saudi talent */}
                <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b0b] shadow-2xl">
                  <Image
                    src={HERO_IMAGES.saudi}
                    alt={
                      isAr
                        ? "موهبة سعودية"
                        : "Saudi talent"
                    }
                    fill
                    priority
                    sizes="(min-width: 1280px) 18vw, 20vw"
                    className="object-cover object-top transition duration-700 group-hover:scale-[1.03]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                  <span className="absolute bottom-4 end-4 rounded-full border border-gold/25 bg-black/45 px-3 py-1.5 text-[10px] text-gold backdrop-blur-lg">
                    {isAr
                      ? "مواهب من المنطقة"
                      : "REGIONAL TALENT"}
                  </span>
                </div>
              </div>

              <div className="absolute -start-5 top-7 z-20 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-[10px] text-white/50 backdrop-blur-xl">
                MLAMH / CASTING
              </div>
            </div>

            {/* Stable row under images - no absolute overlap */}
            <div className="mt-4 grid grid-cols-[0.9fr_1.1fr] gap-4">
              <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#080808]">
                <div className="flex min-h-[92px] items-center gap-3 p-3">
                  <div className="relative h-[68px] w-[94px] shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={HERO_IMAGES.production}
                      alt={
                        isAr
                          ? "كواليس إنتاج وتصوير"
                          : "Production behind the scenes"
                      }
                      fill
                      sizes="94px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] text-gold">
                      {isAr
                        ? "من داخل الصناعة"
                        : "BEHIND THE SCENES"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/70">
                      {isAr
                        ? "من الكاستينغ إلى موقع التصوير"
                        : "From casting to production"}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href={`/${locale}/opportunities`}
                className="group flex min-h-[92px] items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] transition duration-300 hover:border-gold/35 hover:bg-white/[0.05]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-black">
                  <BriefcaseBusiness size={19} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[10px] text-gold">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    {isAr
                      ? "فرص متاحة"
                      : "OPEN OPPORTUNITIES"}
                  </span>

                  <span className="mt-1 block text-sm font-medium text-white">
                    {isAr
                      ? "اكتشف أحدث فرص الكاستينغ"
                      : "Discover new casting calls"}
                  </span>
                </span>

                <DirectionArrow
                  size={17}
                  className="shrink-0 text-white/35 transition group-hover:text-gold"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery strip */}
      <div className="border-t border-white/[0.07] bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-6 px-6 py-5 lg:px-10 xl:px-16">
          <p className="text-xs text-white/35">
            {isAr
              ? "اكتشف المواهب، الفرص والمشاريع في مكان واحد"
              : "Discover talent, opportunities and projects in one place"}
          </p>

          <div className="hidden items-center gap-7 md:flex">
            <Link
              href={`/${locale}/talent`}
              className="flex items-center gap-2 text-xs text-white/55 transition hover:text-gold"
            >
              <UsersRound size={15} />
              {isAr ? "المواهب" : "Talents"}
            </Link>

            <Link
              href={`/${locale}/opportunities`}
              className="flex items-center gap-2 text-xs text-white/55 transition hover:text-gold"
            >
              <BriefcaseBusiness size={15} />
              {isAr ? "الفرص" : "Opportunities"}
            </Link>

            <Link
              href={`/${locale}/publishers`}
              className="flex items-center gap-2 text-xs text-white/55 transition hover:text-gold"
            >
              <Building2 size={15} />
              {isAr ? "الشركات" : "Companies"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
