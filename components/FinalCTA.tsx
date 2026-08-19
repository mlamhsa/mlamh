import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Sparkles,
  Users,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

export function FinalCTA({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/10 bg-black py-12 md:py-20 lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.10] blur-[170px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,106,0.10),transparent_52%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
  <div className="relative overflow-hidden rounded-[2rem] border border-gold/15 bg-gradient-to-b from-white/[0.055] via-white/[0.025] to-transparent p-5 md:rounded-[2.5rem] md:p-12 lg:p-16">
          <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

          <div className="mx-auto max-w-4xl text-center">
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-5 py-2 text-[10px] text-gold",
                isAr
                  ? "tracking-normal"
                  : "uppercase tracking-[0.28em]",
              ].join(" ")}
            >
              <Sparkles size={14} />
              MLAMH
            </div>

            <h2 className="mt-6 text-3xl font-light leading-[1.2] tracking-normal text-white md:mt-8 md:text-6xl lg:text-7xl">
              {isAr
                ? "مكان واحد تبدأ منه فرصتك القادمة."
                : "One Place to Start What Comes Next."}
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 tracking-normal text-white/50 md:mt-6 md:leading-8 md:text-base">
              {isAr
                ? "سواء كنت موهبة تبحث عن فرصة، أو جهة تبحث عن الشخص المناسب لمشروعها، ملامح تجمع رحلة الاكتشاف والتقديم والكاست في تجربة واحدة."
                : "Whether you're talent looking for your next opportunity or an organization searching for the right person, MLAMH brings discovery, applications, and casting into one experience."}
            </p>
          </div>

          <div className="mt-8 grid gap-3 lg:mt-12 lg:grid-cols-3 lg:gap-4">
            {/* Talent */}
            <Link
              href={`/${locale}/join?type=talent`}
              className="group relative overflow-hidden rounded-[1.5rem] border border-gold/30 bg-gold p-5 text-black transition duration-300 hover:-translate-y-1 md:rounded-[1.75rem] md:p-6"
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/20 blur-3xl" />

              <div className="relative">
                <Users size={24} />

                <p className="mt-5 text-[10px] opacity-60 md:mt-8">
                  {isAr ? "للمواهب" : "FOR TALENT"}
                </p>

                <h3 className="mt-2 text-xl font-medium tracking-normal">
                  {isAr ? "أنشئ ملفك المهني" : "Create Your Talent Profile"}
                </h3>

                <p className="mt-3 text-sm leading-6 opacity-65">
                  {isAr
                    ? "اعرض أعمالك، اكتشف الفرص وابدأ التقديم."
                    : "Show your work, discover opportunities, and start applying."}
                </p>

                <div className="mt-6 flex items-center justify-between md:mt-8">
                  <span className="text-sm tracking-normal opacity-80">
                    {isAr ? "ابدأ الآن" : "Get Started"}
                  </span>

                  <ArrowUpRight className="transition group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Organization */}
            <Link
              href={`/${locale}/join?type=publisher`}
              className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:bg-white/[0.05] md:rounded-[1.75rem] md:p-6"
            >
              <BriefcaseBusiness
                className="text-gold"
                size={24}
              />

<p className="mt-5 text-[10px] text-white/30 md:mt-8">
  {isAr ? "للجهات" : "FOR ORGANIZATIONS"}
</p>

<h3 className="mt-2 text-xl font-light tracking-normal text-white">
  {isAr
    ? "انشر فرصك واكتشف المواهب"
    : "Publish & Discover Talent"}
</h3>

<p className="mt-3 text-sm leading-6 text-white/45">
  {isAr
    ? "أنشئ فرص الكاست، استقبل المتقدمين واختر الأنسب."
    : "Create casting opportunities, review applicants, and choose the right talent."}
</p>

<div className="mt-6 flex items-center justify-between md:mt-8">
  <span className="text-sm tracking-normal text-white/55">
    {isAr ? "سجل كجهة" : "Join as Organization"}
  </span>

  <ArrowUpRight className="text-gold transition group-hover:-translate-y-1 group-hover:translate-x-1" />
</div>
            </Link>

            {/* Discovery */}
            <Link
              href={talentPath(locale)}
              className="group relative hidden overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:bg-white/[0.05] lg:block"
            >
              <Sparkles
                className="text-gold"
                size={24}
              />

              <p className="mt-8 text-[10px] text-white/30">
                {isAr ? "للاستكشاف" : "DISCOVER"}
              </p>

              <h3 className="mt-2 text-xl font-light tracking-normal text-white">
                {isAr
                  ? "استكشف المواهب"
                  : "Explore Talent"}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/45">
                {isAr
                  ? "تصفح الملفات المنشورة واكتشف الوجوه المناسبة."
                  : "Browse published profiles and discover the right faces."}
              </p>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm tracking-normal text-white/55">
                  {isAr ? "ابدأ الاستكشاف" : "Start Exploring"}
                </span>

                <ArrowUpRight className="text-gold transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          <div className="mt-8 border-t border-white/[0.08] pt-5 text-center md:mt-12 md:pt-7">
            <p
              className={[
                "text-[10px] text-white/25",
                isAr
                  ? "tracking-normal"
                  : "uppercase tracking-[0.30em]",
              ].join(" ")}
            >
              {isAr
                ? "مواهب • جهات • فرص • كاستينغ"
                : "TALENT • ORGANIZATIONS • OPPORTUNITIES • CASTING"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}