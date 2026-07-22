"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useParams } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import type {
  HomepageHeroCardIcon,
  PublicHomepageHero,
} from "@/lib/types/homepage";

type HeroProps = {
  locale?: Locale;
  data: PublicHomepageHero;
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

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative isolate min-h-[94vh] overflow-hidden bg-black px-6 pt-32 text-white"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.18),transparent_45%),linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_45%)]" />

      <div className="absolute left-1/2 top-24 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-gold/10 bg-gold/[0.03] blur-3xl" />

      <div className="mx-auto grid min-h-[calc(94vh-8rem)] max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className={isAr ? "text-right" : "text-left"}>
          {data.eyebrow ? (
            <p className="arabic-safe mb-6 inline-flex rounded-full border border-gold/20 bg-gold/[0.06] px-5 py-2 text-[11px] uppercase tracking-[0.28em] text-gold">
              {data.eyebrow}
            </p>
          ) : null}

          <h1 className="max-w-4xl text-5xl font-light leading-[1.05] tracking-tight md:text-7xl">
            {data.titleLine1}

            {data.titleLine2 ? (
              <span className="block text-gold">
                {data.titleLine2}
              </span>
            ) : null}
          </h1>

          {data.description ? (
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/55 md:text-lg">
              {data.description}
            </p>
          ) : null}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {data.primaryCtaLabel ? (
              <Link
                href={data.primaryCtaHref}
                className="arabic-safe inline-flex items-center justify-center gap-3 rounded-full bg-gold px-8 py-4 text-xs font-medium uppercase tracking-[0.24em] text-black transition hover:bg-[#e0bd73]"
              >
                {data.primaryCtaLabel}

                <ArrowUpRight size={16} />
              </Link>
            ) : null}

            {data.secondaryCtaLabel ? (
              <Link
                href={data.secondaryCtaHref}
                className="arabic-safe inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-xs uppercase tracking-[0.24em] text-white/70 transition hover:border-gold/40 hover:text-gold"
              >
                {data.secondaryCtaLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-4">
              {data.cards.map((card) => (
                <HeroCard
                  key={card.id}
                  icon={getHeroIcon(card.iconKey)}
                  title={card.title}
                  text={card.description}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {data.stats.map((stat, index) => (
              <HeroStat
                key={`${stat.label}-${index}`}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getHeroIcon(
  iconKey: HomepageHeroCardIcon,
) {
  switch (iconKey) {
    case "building":
      return <Building2 size={20} />;

    case "sparkles":
      return <Sparkles size={20} />;

    case "users":
    default:
      return <UsersRound size={20} />;
  }
}

function HeroCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
      <div className="mb-4 inline-flex rounded-full border border-gold/20 bg-gold/[0.06] p-3 text-gold">
        {icon}
      </div>

      <h3 className="text-xl font-light">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-7 text-white/45">
        {text}
      </p>
    </div>
  );
}

function HeroStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className="text-2xl font-light text-white">
        {value}
      </p>

      <p className="arabic-safe mt-1 text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
    </div>
  );
}