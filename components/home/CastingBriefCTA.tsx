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
              {isRtl ? "لديك مشروع وتحتاج مواهب؟" : "Need talent for a project?"}
            </p>
          </div>

          <h2 className="mt-4 text-3xl font-light leading-tight sm:text-4xl lg:text-5xl">
            {isRtl
              ? "أرسل الـ Brief، وملامح تساعدك في تنظيم الكاستينغ من الاحتياج إلى القائمة المختصرة."
              : "Send the brief and let MLAMH organize the casting from requirements to shortlist."}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-8 text-white/50 sm:text-base">
            {isRtl
              ? "للشركات والوكالات وجهات الإنتاج والعلامات: أرسل احتياجك الحالي حتى لو لم يكن إعلانًا كاملًا، ونراجع النطاق قبل أي التزام أو نشر."
              : "For companies, agencies, production teams, and brands: send what you know now, even if the casting notice is not finished. We review the scope before any commitment or publication."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href={`/${locale}/casting#casting-brief`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-medium text-black transition hover:brightness-110"
          >
            {isRtl ? "أرسل Brief الكاستينغ" : "Send casting brief"}
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/${locale}/contact`}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm text-white/60 transition hover:border-gold/30 hover:text-gold"
          >
            {isRtl ? "تواصل مع الفريق" : "Contact the team"}
          </Link>
        </div>
      </div>
    </section>
  );
}
