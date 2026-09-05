import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type { PublicHomepageHero } from "@/lib/types/homepage";

export function MobileHero({
  locale,
  data,
}: {
  locale: Locale;
  data: PublicHomepageHero;
}) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  const eyebrow =
    data.eyebrow ||
    (isArabic ? "منصة المواهب الإبداعية" : "Creative talent platform");
  const titleLine1 =
    data.titleLine1 ||
    (isArabic ? "اكتشف فرصتك القادمة" : "Discover your next opportunity");
  const description =
    data.description ||
    (isArabic
      ? "اكتشف المواهب والفرص والجهات الإبداعية من مكان واحد."
      : "Discover talents, opportunities, and creative organizations in one place.");

  return (
    <section className="px-4 pb-8 pt-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.065] via-white/[0.025] to-transparent p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="pointer-events-none absolute -end-20 -top-24 h-56 w-56 rounded-full bg-gold/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -start-24 bottom-0 h-44 w-44 rounded-full bg-white/[0.025] blur-3xl" />

        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1.5 text-xs text-gold backdrop-blur-md">
            <Sparkles size={14} />
            <span>{eyebrow}</span>
          </div>

          <h1
            className={[
              "max-w-sm text-[2.15rem] font-semibold leading-[1.15] text-white",
              isArabic ? "tracking-normal" : "tracking-tight",
            ].join(" ")}
          >
            {titleLine1}
            {data.titleLine2 ? (
              <span className="mt-1 block text-gold">{data.titleLine2}</span>
            ) : null}
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-7 text-white/50">
            {description}
          </p>
        </div>

        <Link
          href={`/${locale}/talent`}
          className="group relative z-10 mt-5 flex min-h-[58px] items-center gap-3 rounded-[1.15rem] border border-white/10 bg-black/25 px-4 text-white/45 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl transition active:scale-[0.99] active:bg-white/[0.07]"
        >
          <Search size={20} className="shrink-0 text-gold" />
          <span className="flex-1 text-sm">
            {isArabic
              ? "ابحث عن موهبة أو تخصص..."
              : "Search for talent or expertise..."}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.025] text-white/40">
            <DirectionArrow size={15} />
          </span>
        </Link>

        <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
          {data.primaryCtaLabel ? (
            <Link
              href={data.primaryCtaHref}
              style={{
                background:
                  "linear-gradient(135deg, #E4C875 0%, #D5B35F 55%, #C59A43 100%)",
                borderColor: "rgba(228, 200, 117, 0.55)",
                boxShadow: "0 14px 35px rgba(197, 154, 67, 0.16)",
              }}
              className="flex min-h-[72px] items-center justify-center rounded-[1.35rem] border px-4 text-center text-[15px] font-semibold text-[#090909] transition active:scale-[0.985]"
            >
              {data.primaryCtaLabel}
            </Link>
          ) : null}

          {data.secondaryCtaLabel ? (
            <Link
              href={data.secondaryCtaHref}
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
                borderColor: "rgba(255,255,255,0.13)",
                boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
              }}
              className="flex min-h-[72px] items-center justify-center rounded-[1.35rem] border px-4 text-center text-[15px] font-medium text-white/80 backdrop-blur-xl transition active:scale-[0.985]"
            >
              {data.secondaryCtaLabel}
            </Link>
          ) : null}
        </div>

        <div className="relative z-10 mt-4 grid h-[285px] grid-cols-[1.15fr_0.85fr] gap-3">
          <Link
            href={`/${locale}/talent`}
            className="group relative isolate h-full overflow-hidden rounded-[1.8rem] bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <Image
              src="/images/home/hero-actor.webp"
              alt={isArabic ? "موهبة ممثل" : "Actor talent"}
              fill
              priority
              unoptimized
              sizes="65vw"
              className="scale-[1.01] object-cover object-top transition duration-700 group-active:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="inline-flex rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] text-white/70 backdrop-blur-md">
                {isArabic ? "ممثل" : "Actor"}
              </span>
              <p className="mt-2 max-w-[12rem] text-lg font-semibold leading-6 text-white">
                {isArabic
                  ? "وجوه جديدة تستحق فرصتها"
                  : "New faces deserve a chance"}
              </p>
            </div>
          </Link>

          <div className="grid h-full min-h-0 grid-rows-2 gap-3">
            <Link
              href={`/${locale}/talent`}
              className="group relative isolate min-h-0 overflow-hidden rounded-[1.45rem] bg-[#0a0a0a]"
            >
              <Image
                src="/images/home/hero-model.webp"
                alt={isArabic ? "موهبة مودل" : "Model talent"}
                fill
                unoptimized
                sizes="35vw"
                className="scale-[1.01] object-cover object-top transition duration-700 group-active:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute bottom-3 end-3 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] text-white/70 backdrop-blur-md">
                {isArabic ? "مودل" : "Model"}
              </span>
            </Link>

            <Link
              href={`/${locale}/talent`}
              className="group relative isolate min-h-0 overflow-hidden rounded-[1.45rem] bg-[#0a0a0a]"
            >
              <Image
                src="/images/home/55.jpg"
                alt={isArabic ? "موهبة من المنطقة" : "Regional talent"}
                fill
                unoptimized
                sizes="35vw"
                className="scale-[1.01] object-cover object-top transition duration-700 group-active:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <span className="absolute bottom-3 end-3 rounded-full border border-gold/25 bg-black/50 px-2.5 py-1 text-[9px] text-gold backdrop-blur-md">
                {isArabic ? "مواهب من المنطقة" : "Regional talent"}
              </span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-4 text-[11px] text-white/35">
          <span>
            {isArabic
              ? "مواهب • فرص • جهات"
              : "Talent • Opportunities • Organizations"}
          </span>
          <span className="font-medium tracking-[0.12em] text-gold/70">MLAMH</span>
        </div>
      </div>
    </section>
  );
}
