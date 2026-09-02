"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getAdminLanguage, withAdminLanguage } from "@/lib/admin/i18n";
import { marketingHubNavigation } from "@/lib/marketing/navigation";

export function MarketingHubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = getAdminLanguage(searchParams.get("lang"));
  const isArabic = language === "ar";

  return (
    <nav
      aria-label={isArabic ? "أقسام مركز التسويق" : "Marketing Hub sections"}
      className="mb-8 overflow-x-auto rounded-[1.35rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.02] p-2 shadow-[0_14px_45px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/[0.015]"
    >
      <div className="flex min-w-max gap-1.5">
        {marketingHubNavigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin/marketing" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={withAdminLanguage(item.href, language)}
              aria-current={active ? "page" : undefined}
              className={`group relative inline-flex min-h-11 select-none items-center gap-2 overflow-hidden rounded-xl border px-3.5 py-2 text-xs outline-none transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-gold/35 ${
                active
                  ? "border-gold/30 bg-gold/[0.11] text-gold shadow-[0_8px_28px_rgba(212,175,55,0.08)]"
                  : "border-transparent text-white/45 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {active ? <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" /> : null}
              <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active ? "scale-105" : "group-hover:scale-105"}`} aria-hidden="true" />
              <span className="relative">{isArabic ? item.labelAr : item.labelEn}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
