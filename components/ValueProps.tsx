import {
  BadgeCheck,
  ClipboardCheck,
  Building2,
  Globe,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type {
  HomepageValuePropIcon,
  PublicHomepageValueProp,
} from "@/lib/types/value-props";

type ValuePropsProps = {
  locale: Locale;
  data: PublicHomepageValueProp[];
};

export function ValueProps({
  locale,
  data,
}: ValuePropsProps) {
  const isAr = locale === "ar";

  return (
    <section
      id="about"
      dir={isAr ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/[0.07] bg-black py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,169,106,0.10),transparent_38%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1520px] px-6 lg:px-10 xl:px-16">
        <div className="grid items-end gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          {/* Intro */}
          <div className={isAr ? "text-right" : "text-left"}>
            <p
              className={[
                "text-xs text-gold",
                isAr
                  ? "tracking-normal"
                  : "uppercase tracking-[0.28em]",
              ].join(" ")}
            >
              {isAr ? "لماذا ملامح" : "Why MLAMH"}
            </p>

            <h2
              className={[
                "mt-5 max-w-3xl text-4xl font-light leading-[1.08] text-white md:text-5xl xl:text-6xl",
                isAr
                  ? "tracking-normal"
                  : "tracking-tight",
              ].join(" ")}
            >
              {isAr
                ? "كل ما تحتاجه لاكتشاف الموهبة المناسبة، في مكان واحد."
                : "Everything you need to discover the right talent, in one place."}
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/48">
              {isAr
                ? "ملامح تجمع المواهب، الجهات، والفرص داخل تجربة واحدة مصممة لتكون أسرع، أوضح، وأكثر احترافية."
                : "MLAMH brings talents, organizations, and opportunities into one experience built to be faster, clearer, and more professional."}
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {data.slice(0, 4).map((item, index) => {
              const Icon = getIcon(item.iconKey);

              return (
                <article
                  key={item.id}
                  className={[
                    "group relative overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-300 hover:border-gold/30 hover:bg-white/[0.045]",
                    index === 0
                      ? "sm:col-span-2"
                      : "",
                  ].join(" ")}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
                    aria-hidden="true"
                  >
                    <div className="absolute -end-12 -top-12 h-40 w-40 rounded-full bg-gold/[0.06] blur-3xl" />
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between gap-5">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                        <Icon size={19} />
                      </div>

                      <span className="text-[10px] text-white/20">
                        0{index + 1}
                      </span>
                    </div>

                    <h3
                      className={[
                        "mt-6 text-2xl font-light leading-tight text-white",
                        index === 0
                          ? "md:text-3xl"
                          : "",
                      ].join(" ")}
                    >
                      {item.title}
                    </h3>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/42">
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Bottom proof strip */}
        <div className="mt-10 grid gap-3 border-t border-white/[0.07] pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3 text-sm text-white/45">
            <Shield size={16} className="text-gold" />
            <span>
              {isAr
                ? "مراجعة واعتماد للملفات"
                : "Profile review and approval"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/45">
            <BriefcaseMini />
            <span>
              {isAr
                ? "فرص حقيقية من جهات موثوقة"
                : "Real opportunities from trusted organizations"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/45">
            <Sparkles size={16} className="text-gold" />
            <span>
              {isAr
                ? "اكتشاف أسرع للمواهب المناسبة"
                : "Faster talent discovery"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function BriefcaseMini() {
  return (
    <Building2
      size={16}
      className="shrink-0 text-gold"
    />
  );
}

function getIcon(icon: HomepageValuePropIcon) {
  switch (icon) {
    case "shield":
      return Shield;

    case "globe":
      return Globe;

    case "zap":
      return Zap;

    case "building":
      return Building2;

    case "clipboard":
      return ClipboardCheck;

    case "badge":
      return BadgeCheck;

    case "sparkles":
      return Sparkles;

    default:
      return Sparkles;
  }
}