"use client";

import Link from "next/link";
import { BookOpenText, Building2, Clapperboard, Compass, Search, Sparkles, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { key: "home", ar: "المشهد", en: "Scene", href: "", icon: Sparkles },
  { key: "talent", ar: "للمواهب", en: "Talent", href: "/category/talent", icon: UserRound },
  { key: "publishers", ar: "للناشرين", en: "Publishers", href: "/category/publishers", icon: Building2 },
  { key: "industry", ar: "الكاستنج والإنتاج", en: "Casting & Production", href: "/category/industry", icon: Clapperboard },
  { key: "using-mlamh", ar: "استخدام ملامح", en: "Using MLAMH", href: "/category/using-mlamh", icon: Compass },
  { key: "reports", ar: "تقارير ورؤى", en: "Reports", href: "/category/reports", icon: BookOpenText },
] as const;

export function SceneWorldNav({ locale }: { locale: "ar" | "en" }) {
  const pathname = usePathname();
  const isArabic = locale === "ar";
  const root = `/${locale}/scene`;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="sticky top-16 z-[70] border-b border-white/[0.07] bg-black/90 backdrop-blur-2xl lg:top-24"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">
        <Link
          href={root}
          className="me-1 hidden shrink-0 items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-2 text-[11px] font-medium text-gold sm:inline-flex"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isArabic ? "مشهد ملامح" : "MLAMH Scene"}
        </Link>

        {items.map((item) => {
          const href = `${root}${item.href}`;
          const active = item.key === "home" ? pathname === root : pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs transition",
                active
                  ? "bg-white/[0.08] text-gold"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              {isArabic ? item.ar : item.en}
            </Link>
          );
        })}

        <Link
          href={`${root}/search`}
          className="ms-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-gold/25 hover:text-gold"
        >
          <Search className="h-3.5 w-3.5" />
          {isArabic ? "بحث" : "Search"}
        </Link>
      </div>
    </div>
  );
}
