import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function ValueProps({ locale }: { locale: Locale }) {
  const isAr = locale === "ar";

  const items = [
    {
      icon: BadgeCheck,
      title: isAr ? "مواهب موثوقة" : "Verified Talent",
      text: isAr
        ? "ملفات احترافية، معرض أعمال، وحالة اعتماد واضحة."
        : "Professional profiles, portfolios, and clear verification status.",
    },
    {
      icon: Building2,
      title: isAr ? "شركات وفرص حقيقية" : "Trusted Companies",
      text: isAr
        ? "فرص من جهات وشركات تبحث عن مواهب مناسبة بجدية."
        : "Opportunities from companies actively looking for the right talent.",
    },
    {
      icon: ClipboardCheck,
      title: isAr ? "تقديم أسهل" : "Simpler Applications",
      text: isAr
        ? "تابع طلباتك، حالتك، والتنبيهات من مكان واحد."
        : "Track applications, status updates, and notifications in one place.",
    },
    {
      icon: Sparkles,
      title: isAr ? "تجربة راقية" : "Premium Experience",
      text: isAr
        ? "واجهة مصممة لتجعل الاكتشاف والتواصل أكثر وضوحًا وثقة."
        : "A refined experience built for clear discovery and trusted connection.",
    },
  ];

  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-black py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,169,106,0.10),transparent_45%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
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
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 transition hover:border-gold/30 hover:bg-gold/[0.05]"
              >
                <div className="mb-6 inline-flex rounded-full border border-gold/20 bg-gold/[0.06] p-3 text-gold">
                  <Icon size={20} />
                </div>

                <h3 className="text-2xl font-light text-white">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/45">
                  {item.text}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}