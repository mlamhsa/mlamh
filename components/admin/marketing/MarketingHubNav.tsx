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
      className="mb-8 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2"
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
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition ${
                active
                  ? "border-gold/25 bg-gold/[0.1] text-gold"
                  : "border-transparent text-white/45 hover:border-white/[0.08] hover:bg-white/[0.035] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{isArabic ? item.labelAr : item.labelEn}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
