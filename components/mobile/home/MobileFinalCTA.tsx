import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Sparkles,
  UsersRound,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";

export function MobileFinalCTA({
  locale,
}: {
  locale: Locale;
}) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section
      dir={isArabic ? "rtl" : "ltr"}
      className="relative overflow-hidden px-4 pb-10 pt-1"
    >
      {/* Ambient layer */}
      <div className="pointer-events-none absolute -end-24 top-8 h-60 w-60 rounded-full bg-gold/[0.035] blur-[100px]" />

      <div className="relative overflow-hidden rounded-[1.85rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-5 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
        <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Intro */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.055] px-3 py-1.5 text-[10px] text-gold">
            <Sparkles size={13} strokeWidth={1.7} />
            MLAMH
          </div>

          <h2 className="mt-4 max-w-[18rem] text-[1.65rem] font-semibold leading-[1.2] text-white">
            {isArabic
              ? "خطوتك القادمة تبدأ من هنا"
              : "Your next step starts here"}
          </h2>

          <p className="mt-2.5 max-w-[19rem] text-[13px] leading-6 text-white/38">
            {isArabic
              ? "ابدأ كموهبة وابنِ ملفك المهني، أو سجّل كجهة وانشر فرصك واكتشف الأشخاص المناسبين."
              : "Build your professional talent profile, or join as an organization and discover the right people."}
          </p>
        </div>

        {/* Talent primary action */}
        <Link
          href={`/${locale}/join?type=talent`}
          className="group relative mt-5 block overflow-hidden rounded-[1.45rem] border border-gold/30 bg-gold p-4.5 text-black shadow-[0_16px_42px_rgba(205,166,92,0.13)] transition active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <UsersRound
              size={23}
              strokeWidth={1.7}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-black/50">
                {isArabic ? "للمواهب" : "FOR TALENT"}
              </p>

              <h3 className="mt-1 text-[18px] font-semibold leading-6">
                {isArabic
                  ? "أنشئ ملفك المهني"
                  : "Create your professional profile"}
              </h3>

              <p className="mt-1.5 text-[12px] leading-5 text-black/55">
                {isArabic
                  ? "اعرض أعمالك، اكتشف الفرص وابدأ التقديم."
                  : "Show your work, discover opportunities, and start applying."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3.5">
            <span className="text-[13px] font-semibold text-black/65">
              {isArabic ? "ابدأ الآن" : "Get started"}
            </span>

            <DirectionArrow
              size={17}
              className="transition-transform group-active:-translate-x-1"
            />
          </div>
        </Link>

        {/* Organization secondary action */}
        <Link
          href={`/${locale}/join?type=publisher`}
          className="group relative mt-3 block overflow-hidden rounded-[1.45rem] border border-white/[0.08] bg-white/[0.028] p-4.5 text-white transition active:scale-[0.99] active:border-gold/20 active:bg-white/[0.045]"
        >
          <div className="flex items-start gap-4">
            <BriefcaseBusiness
              size={23}
              strokeWidth={1.7}
              className="mt-0.5 shrink-0 text-gold"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium text-gold/65">
                {isArabic ? "للجهات" : "FOR ORGANIZATIONS"}
              </p>

              <h3 className="mt-1 text-[18px] font-semibold leading-6 text-white">
                {isArabic
                  ? "انشر فرصك واكتشف المواهب"
                  : "Publish opportunities and discover talent"}
              </h3>

              <p className="mt-1.5 text-[12px] leading-5 text-white/36">
                {isArabic
                  ? "استقبل المتقدمين واختر الأنسب لمشروعك."
                  : "Receive applicants and choose the right people for your project."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3.5">
            <span className="text-[13px] font-medium text-white/48">
              {isArabic ? "سجّل كجهة" : "Join as organization"}
            </span>

            <DirectionArrow
              size={17}
              className="text-gold transition-transform group-active:-translate-x-1"
            />
          </div>
        </Link>

        {/* Ecosystem line */}
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-3.5 text-[9px] text-white/20">
          <span>
            {isArabic
              ? "مواهب • فرص • جهات • كاست"
              : "TALENT • OPPORTUNITIES • ORGANIZATIONS • CASTING"}
          </span>

          <span className="tracking-[0.14em] text-gold/50">
            MLAMH
          </span>
        </div>
      </div>
    </section>
  );
}