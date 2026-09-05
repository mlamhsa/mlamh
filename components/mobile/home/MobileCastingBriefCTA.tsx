import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";

import type { Locale } from "@/lib/i18n";

export function MobileCastingBriefCTA({ locale }: { locale: Locale }) {
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  return (
    <section dir={isArabic ? "rtl" : "ltr"} className="px-4 pb-6 pt-1">
      <Link
        href={`/${locale}/casting#casting-brief`}
        className="group relative block overflow-hidden rounded-[1.75rem] border border-gold/25 bg-gold/[0.065] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute -end-16 -top-20 h-44 w-44 rounded-full bg-gold/[0.11] blur-3xl" />

        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-gold/25 bg-black/20 text-gold">
            <ClipboardList size={22} strokeWidth={1.7} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-gold/70">
              {isArabic ? "للشركات والوكالات وجهات الإنتاج" : "FOR COMPANIES, AGENCIES & PRODUCTIONS"}
            </p>
            <h2 className="mt-1 text-[1.05rem] font-semibold leading-6 text-white">
              {isArabic
                ? "عندك مشروع وتحتاج ممثلين أو مودلز؟ أرسل الـ Brief"
                : "Need actors or models for a project? Send the brief"}
            </h2>
            <p className="mt-1.5 text-[12px] leading-5 text-white/40">
              {isArabic
                ? "أرسل احتياج الكاستينغ مباشرة إلى فريق ملامح."
                : "Send your casting requirements directly to the MLAMH team."}
            </p>
          </div>

          <DirectionArrow size={17} className="shrink-0 text-gold/65 transition-transform group-active:-translate-x-1" />
        </div>
      </Link>
    </section>
  );
}
