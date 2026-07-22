import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { talentPath } from "@/lib/utils/routes";

export function Agencies({ locale }: { locale: Locale }) {
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
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden border-y border-white/[0.06] bg-black px-6 py-24 text-white lg:py-32"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-1/4 h-[520px] w-[520px] rounded-full bg-gold/[0.07] blur-[150px]" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-white/[0.025] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,159,94,0.08),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div
            className={`flex min-h-[480px] flex-col justify-between rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-7 backdrop-blur md:p-10 ${
              isRtl ? "text-right" : "text-left"
            }`}
          >
            <div>
              <p className="arabic-safe mb-4 text-[10px] uppercase tracking-[0.4em] text-gold">
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
                className="mt-6 max-w-2xl text-sm leading-7 text-white/55 md:text-base"
                style={{ fontFamily: bodyFont }}
              >
                {isRtl
                  ? "مَلامِح تساعد الجهات الإبداعية على اكتشاف المواهب، مراجعة ملفاتهم، وإرسال طلبات كاست مباشرة."
                  : "MLAMH helps creative teams discover talent, review profiles, and send direct casting requests."}
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={talentPath(locale)}
                className="arabic-safe inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold/[0.08] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "استكشف المواهب" : "Browse Talents"}
              </Link>

              <a
                href="#contact"
                className="arabic-safe inline-flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                {isRtl ? "تواصل معنا" : "Contact Us"}
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-6 backdrop-blur transition duration-500 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.055] md:p-7"
              >
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent opacity-0 transition group-hover:opacity-100" />

                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-black/40 text-[10px] uppercase tracking-[0.2em] text-gold shadow-[0_0_35px_rgba(201,159,94,0.08)]">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className={isRtl ? "text-right" : "text-left"}>
                    <h3
                      className="text-2xl font-light text-white"
                      style={{ fontFamily: displayFont }}
                    >
                      {feature.title}
                    </h3>

                    <p
                      className="mt-3 text-sm leading-7 text-white/55"
                      style={{ fontFamily: bodyFont }}
                    >
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
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-5 text-center transition hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.045]"
            >
              <p className="arabic-safe text-[10px] uppercase tracking-[0.25em] text-white/50 transition group-hover:text-gold">
                {industry}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}