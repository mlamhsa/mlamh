import Link from "next/link";

import { PublicTalentCard } from "@/components/public/PublicTalentCard";
import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

export function TalentSeoLanding({
  locale,
  eyebrow,
  title,
  description,
  talents,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  talents: Talent[];
}) {
  const isRtl = locale === "ar";
  const discoveryLinks = [
    { href: `/${locale}/talent/category/actor`, label: isRtl ? "ممثلون في السعودية" : "Actors in Saudi Arabia" },
    { href: `/${locale}/talent/category/model`, label: isRtl ? "مودلز في السعودية" : "Models in Saudi Arabia" },
    { href: `/${locale}/talent/city/riyadh`, label: isRtl ? "ممثلون ومودلز في الرياض" : "Actors & Models in Riyadh" },
    { href: `/${locale}/opportunities/type/acting`, label: isRtl ? "فرص تمثيل وكاستينج" : "Acting & casting opportunities" },
    { href: `/${locale}/opportunities/type/modeling`, label: isRtl ? "فرص مودل وتصوير" : "Modeling & photo shoot opportunities" },
  ];

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-white/55 sm:text-base">{description}</p>
          <Link href={`/${locale}/talent`} className="mt-6 inline-flex rounded-xl border border-gold/30 px-4 py-2.5 text-sm text-gold transition hover:bg-gold/10">
            {isRtl ? "تصفح جميع المواهب" : "Browse all talents"}
          </Link>
        </header>

        <nav aria-label={isRtl ? "اكتشف المزيد" : "Discover more"} className="mb-10 flex flex-wrap gap-2">
          {discoveryLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2 text-sm text-white/65 transition hover:border-gold/30 hover:text-gold">
              {link.label}
            </Link>
          ))}
        </nav>

        {talents.length > 0 ? (
          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {talents.map((talent) => <PublicTalentCard key={talent.id} talent={talent} locale={locale} />)}
          </section>
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/50">
            {isRtl ? "لا توجد ملفات منشورة ضمن هذا التصنيف حاليًا." : "No published profiles are available in this directory yet."}
          </section>
        )}
      </div>
    </main>
  );
}
