import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Sparkles, Users } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

export function FinalCTA({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,169,106,0.14),transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="overflow-hidden rounded-[2.5rem] border border-gold/15 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-10 md:p-16">

          <div className="mx-auto max-w-3xl text-center">

            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-5 py-2 text-xs uppercase tracking-[0.28em] text-gold">
              <Sparkles size={14} />
              MLAMH
            </div>

            <h2 className="mt-8 text-4xl font-light leading-tight text-white md:text-6xl">
              {isAr
                ? "ابدأ رحلتك الإبداعية اليوم."
                : "Start Your Creative Journey Today."}
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/55">
              {isAr
                ? "سواء كنت موهبة تبحث عن فرص، أو شركة تبحث عن الشخص المناسب، ملامح تجمعكما في مكان واحد."
                : "Whether you're a talent seeking opportunities or a company searching for the right people, MLAMH brings everything together."}
            </p>

          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">

            <Link
              href={`/${locale}/join`}
              className="group rounded-2xl border border-gold/20 bg-gold px-6 py-6 text-black transition hover:scale-[1.02]"
            >
              <Users size={24} />

              <h3 className="mt-5 text-lg font-medium">
                {isAr ? "انضم كموهبة" : "Join as Talent"}
              </h3>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm opacity-80">
                  {isAr ? "ابدأ الآن" : "Get Started"}
                </span>

                <ArrowUpRight className="transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href={`/${locale}/register-publisher`}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-6 transition hover:border-gold/40"
            >
              <BriefcaseBusiness className="text-gold" size={24} />

              <h3 className="mt-5 text-lg font-light text-white">
                {isAr ? "للشركات والوكالات" : "For Companies"}
              </h3>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm text-white/55">
                  {isAr ? "انشر فرصة" : "Post Opportunity"}
                </span>

                <ArrowUpRight className="text-gold transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href={talentPath(locale)}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-6 transition hover:border-gold/40"
            >
              <Sparkles className="text-gold" size={24} />

              <h3 className="mt-5 text-lg font-light text-white">
                {isAr ? "استكشف المواهب" : "Discover Talent"}
              </h3>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-sm text-white/55">
                  {isAr ? "ابدأ الاستكشاف" : "Explore"}
                </span>

                <ArrowUpRight className="text-gold transition group-hover:-translate-y-1 group-hover:translate-x-1" />
              </div>
            </Link>

          </div>

          <div className="mt-14 border-t border-white/10 pt-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/30">
              TALENT • COMPANIES • OPPORTUNITIES • MLAMH
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}