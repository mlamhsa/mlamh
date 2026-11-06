import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";

import type { Locale } from "@/lib/i18n";

export function CastingBriefCTA({ locale }: { locale: Locale }) {
  const isRtl = locale === "ar";

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden border-y border-white/[0.07] bg-black px-6 py-16 text-white md:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(212,160,23,0.12),transparent_38%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-6 rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-gold">
            <ClipboardList className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.25em]">
              {isRtl ? "MLAMH CASTING" : "MLAMH CASTING"}
            </p>
          </div>

          <h2 className="mt-4 text-3xl font-light leading-tight sm:text-4xl lg:text-5xl">
            {isRtl
              ? "تحتاج مودل أو ممثل لتصويرك؟ انشر طلبك"
              : "Need a model or actor? Post your request"}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-white/50 sm:text-base">
            {isRtl
              ? "للمتاجر والصالونات والمصورين والشركات: أنشئ حساب ناشر وانشر احتياجك لتتقدم المواهب المناسبة مباشرة."
              : "For shops, salons, photographers and brands: join as a publisher and post a request so relevant talent can apply."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={`/${locale}/join?type=publisher`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
          >
            {isRtl ? "انشر طلبك" : "Post a request"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/${locale}/talent`}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm text-white/60 transition hover:border-gold/30 hover:text-gold"
          >
            {isRtl ? "استكشف المواهب" : "Browse talent"}
          </Link>
        </div>
      </div>
    </section>
  );
}
