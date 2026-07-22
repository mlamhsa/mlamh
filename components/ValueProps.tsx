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
      dir={isAr ? "rtl" : "ltr"}
      className="relative overflow-hidden border-t border-white/10 bg-black py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.10),transparent_45%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
            {isAr ? "لماذا ملامح" : "Why MLAMH"}
          </p>

          <h2 className="mt-5 text-4xl font-light tracking-tight text-white md:text-6xl">
            {isAr
              ? "منصة مصممة لاكتشاف المواهب بثقة."
              : "Built for trusted creative discovery."}
          </h2>

          <p className="mt-6 text-base leading-8 text-white/50">
            {isAr
              ? "نحوّل رحلة البحث، التقديم، وإدارة الفرص إلى تجربة واضحة واحترافية للطرفين."
              : "We simplify discovery, applications, and opportunity management for both talents and companies."}
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {data.map((item) => {
            const Icon = getIcon(item.iconKey);

            return (
              <article
                key={item.id}
                className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 transition hover:border-gold/30 hover:bg-gold/[0.05]"
              >
                <div className="mb-6 inline-flex rounded-full border border-gold/20 bg-gold/[0.06] p-3 text-gold">
                  <Icon size={20} />
                </div>

                <h3 className="text-2xl font-light text-white">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
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
      return Building2 as never;

    case "clipboard":
      return ClipboardCheck as never;

    case "badge":
      return BadgeCheck as never;

    case "sparkles":
      return Sparkles as never;

    default:
      return Sparkles;
  }
}