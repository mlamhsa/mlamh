import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function FinalCTA({ locale }: { locale: Locale }) {
  const isRtl = locale === "ar";

  const title =
    locale === "ar"
      ? "جاهز تبدأ رحلتك في ملامح؟"
      : "Ready to Start Your Journey with MALAMIH?";

  const subtitle =
    locale === "ar"
      ? "سواء كنت موهبة أو جهة إنتاج، نحن نربطك مباشرة بالفرصة المناسبة"
      : "Whether you're talent or production, we connect you directly to the right opportunity";

  const talent =
    locale === "ar" ? "انضم كموهبة" : "Join as Talent";

  const agency =
    locale === "ar" ? "اطلب موهبة" : "Request Talent";

  const explore =
    locale === "ar" ? "استكشف المواهب" : "Explore Talents";

  return (
    <section className="relative py-32 bg-black border-t border-white/10">

      <div className="mx-auto max-w-4xl px-6 text-center">

        {/* Title */}
        <h2 className="text-4xl md:text-6xl font-light text-white leading-tight">
          {title}
        </h2>

        {/* Subtitle */}
        <p className="mt-6 text-white/60 text-lg leading-8">
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">

          <Link
            href={`/${locale}/talent-login`}
            className="px-8 py-4 rounded-xl bg-white text-black hover:bg-gold transition"
          >
            {talent}
          </Link>

          <Link
            href="/opportunities"
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:border-gold hover:text-gold transition"
          >
            {agency}
          </Link>

          <Link
            href="/talents"
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:border-gold hover:text-gold transition"
          >
            {explore}
          </Link>

        </div>

        {/* Small hint */}
        <p className="mt-10 text-white/30 text-xs uppercase tracking-[0.3em]">
          CASTING · TALENT · OPPORTUNITY
        </p>

      </div>
    </section>
  );
}