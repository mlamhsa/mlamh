import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export function Hero({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const title =
    locale === "ar"
      ? "وجوه تُختار… وفرص تُصنع"
      : "Faces Are Selected… Opportunities Are Created";

  const subtitle =
    locale === "ar"
      ? "منصة تربط المواهب بصنّاع القرار في الإعلانات والإنتاج والمحتوى"
      : "A platform connecting talent with decision makers in advertising, production and content";

  const ctaExplore = locale === "ar" ? "استكشف المواهب" : "Explore Talents";
  const ctaJoin = locale === "ar" ? "انضم كموهبة" : "Join as Talent";
  const ctaPost =
    locale === "ar" ? "ابدأ نشر فرصتك الآن" : "Start Posting Your Opportunity";

  return (
    <section className="relative min-h-screen flex items-center bg-black overflow-hidden pt-28 lg:pt-0">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] -translate-x-1/2 -translate-y-1/2 bg-gold/10 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1
            className="text-white text-[clamp(2.8rem,6vw,5.8rem)] leading-[1.05] font-light tracking-[-0.03em]"
            style={{ fontFamily: displayFont }}
          >
            {title}
          </h1>

          <p className="mt-6 text-white/70 text-lg leading-8 max-w-xl">
            {subtitle}
          </p>

          <div className="mt-10 space-y-3">
            <Link
              href={`/${locale}#talents`}
              className="block w-full lg:w-fit bg-white text-black px-6 py-4 rounded-xl hover:bg-gold transition"
            >
              {ctaExplore}
            </Link>

            <Link
              href={`/${locale}/talent-login`}
              className="block w-full lg:w-fit border border-white/20 text-white px-6 py-4 rounded-xl hover:border-gold hover:text-gold transition"
            >
              {ctaJoin}
            </Link>

            <Link
              href={`/${locale}/publisher-login`}
              className="block w-full lg:w-fit border border-white/20 text-white px-6 py-4 rounded-xl hover:border-gold hover:text-gold transition"
            >
              {ctaPost}
            </Link>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
              <Image
                src="/images/hero-talent.jpg"
                alt="MLAMH Featured Talent"
                width={700}
                height={1000}
                priority
                className="w-full h-[520px] object-cover"
              />
            </div>

            <div className="absolute top-6 right-6 bg-black/60 border border-white/10 px-4 py-2 rounded-full text-xs text-white/70">
              Casting Platform
            </div>

            <div className="absolute -bottom-6 left-0 right-0 grid grid-cols-3 gap-2">
              <div className="bg-black/70 border border-white/10 p-3 rounded-xl text-center">
                <p className="text-white text-sm">ملفات</p>
              </div>

              <div className="bg-black/70 border border-white/10 p-3 rounded-xl text-center">
                <p className="text-white text-sm">فرص</p>
              </div>

              <div className="bg-black/70 border border-white/10 p-3 rounded-xl text-center">
                <p className="text-white text-sm">نخبة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}