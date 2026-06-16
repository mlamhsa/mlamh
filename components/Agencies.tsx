import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

export function Agencies({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  const displayFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-cormorant)";

  const features = isRtl
    ? [
        {
          title: "اكتشاف أسرع",
          body: "استعرض مواهب منشورة ومنظمة حسب التخصص، المدينة، والحضور البصري.",
        },
        {
          title: "ملفات احترافية",
          body: "صور، معرض أعمال، بيانات أساسية، وروابط تواصل في صفحة واحدة واضحة.",
        },
        {
          title: "طلبات مباشرة",
          body: "أرسل طلب كاست للموهبة المناسبة واحتفظ بتفاصيل المشروع داخل النظام.",
        },
      ]
    : [
        {
          title: "Faster Discovery",
          body: "Browse published talent profiles by category, city, and visual presence.",
        },
        {
          title: "Professional Profiles",
          body: "Photos, gallery, key details, and contact links in one clear profile.",
        },
        {
          title: "Direct Requests",
          body: "Send casting requests to the right talent and keep project details organized.",
        },
      ];

  const industries = isRtl
    ? ["وكالات إعلان", "شركات إنتاج", "مديرو كاست", "علامات تجارية"]
    : ["Ad Agencies", "Production Companies", "Casting Directors", "Brands"];

  return (
    <section
      id="agencies"
      className="relative overflow-hidden border-y border-white/[0.06] bg-gray-deep px-6 py-24 text-white lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl">

        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">

          <div className={isRtl ? "text-right" : "text-left"}>

            <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
              {isRtl
                ? "للوكالات وشركات الإنتاج"
                : "For Agencies & Production Companies"}
            </p>

            <h2
              className="max-w-4xl text-4xl font-light leading-tight tracking-tight md:text-6xl"
              style={{ fontFamily: displayFont }}
            >
              {isRtl
                ? "ابحث عن المواهب المناسبة لمشروعك القادم خلال دقائق."
                : "Find the right talent for your next project in minutes."}
            </h2>

            <p
              className="mt-6 max-w-2xl text-sm leading-7 text-gray-muted md:text-base"
              style={{ fontFamily: bodyFont }}
            >
              {isRtl
                ? "مَلامِح تساعد الجهات الإبداعية على اكتشاف المواهب، مراجعة ملفاتهم، وإرسال طلبات كاست مباشرة."
                : "MLAMH helps creative teams discover talent, review profiles, and send direct casting requests."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Link
                href={talentPath(locale)}
                className="inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold/[0.08] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "استكشف المواهب" : "Browse Talents"}
              </Link>

              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {isRtl ? "تواصل معنا" : "Contact Us"}
              </a>

            </div>

          </div>

          <div className="grid gap-4">

            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-[28px] border border-white/[0.08] bg-black/30 p-6 transition hover:border-gold/25"
              >

                <div className="flex items-start gap-5">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 text-[10px] uppercase tracking-[0.2em] text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className={isRtl ? "text-right" : "text-left"}>

                    <h3
                      className="text-2xl font-light text-white"
                      style={{ fontFamily: displayFont }}
                    >
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-white/55">
                      {feature.body}
                    </p>

                  </div>

                </div>

              </article>
            ))}

          </div>

        </div>

        <div className="mt-14 grid gap-4 border-t border-white/[0.08] pt-8 md:grid-cols-4">

          {industries.map((industry) => (
            <div
              key={industry}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-5 text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                {industry}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}