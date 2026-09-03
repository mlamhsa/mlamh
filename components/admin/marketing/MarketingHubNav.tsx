"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getAdminLanguage, withAdminLanguage } from "@/lib/admin/i18n";
import { marketingHubNavigation, marketingHubNavigationGroups } from "@/lib/marketing/navigation";

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/admin/marketing" && pathname.startsWith(`${href}/`));
}

export function MarketingHubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = getAdminLanguage(searchParams.get("lang"));
  const isArabic = language === "ar";
  const overview = marketingHubNavigation.find((item) => item.key === "overview")!;
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenGroup(null);
  }, [pathname, language]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!openGroup) return;
      const target = event.target;
      if (target instanceof Node && !navRef.current?.contains(target)) {
        setOpenGroup(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenGroup(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openGroup]);

  return (
    <nav ref={navRef} aria-label={isArabic ? "أقسام مركز التسويق" : "Marketing Hub sections"} className="relative z-30 mb-8 rounded-[1.35rem] border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.02] p-2 shadow-[0_14px_45px_rgba(0,0,0,0.18)] ring-1 ring-inset ring-white/[0.015]">
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={withAdminLanguage(overview.href, language)}
          aria-current={isItemActive(pathname, overview.href) ? "page" : undefined}
          onClick={() => setOpenGroup(null)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs transition-all ${isItemActive(pathname, overview.href) ? "border-gold/30 bg-gold/[0.11] text-gold" : "border-transparent text-white/55 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"}`}
        >
          <overview.icon className="h-4 w-4" aria-hidden="true" />
          <span>{isArabic ? overview.labelAr : overview.labelEn}</span>
        </Link>

        <span className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block" />

        {marketingHubNavigationGroups.map((group) => {
          const items = group.itemKeys.map((key) => marketingHubNavigation.find((item) => item.key === key)).filter(Boolean) as typeof marketingHubNavigation;
          const active = items.some((item) => isItemActive(pathname, item.href));
          const GroupIcon = group.icon;
          const isOpen = openGroup === group.key;

          return (
            <div key={group.key} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                onClick={() => setOpenGroup((current) => current === group.key ? null : group.key)}
                className={`flex min-h-11 cursor-pointer select-none items-center gap-2 rounded-xl border px-3.5 py-2 text-xs outline-none transition-all ${active ? "border-gold/25 bg-gold/[0.08] text-gold" : "border-transparent text-white/45 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"}`}
              >
                <GroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{isArabic ? group.labelAr : group.labelEn}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>

              {isOpen ? (
                <div role="menu" className="absolute start-1/2 top-full z-50 mt-2 w-[min(19rem,calc(100vw-3rem))] -translate-x-1/2 rounded-2xl border border-white/[0.1] bg-[#101010]/95 p-2 shadow-2xl backdrop-blur-xl rtl:translate-x-1/2">
                  <div className="mb-2 px-2 pt-1">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-gold/45">{isArabic ? group.labelAr : group.labelEn}</p>
                  </div>
                  <div className="grid gap-1">
                    {items.map((item) => {
                      const itemActive = isItemActive(pathname, item.href);
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.key}
                          href={withAdminLanguage(item.href, language)}
                          aria-current={itemActive ? "page" : undefined}
                          role="menuitem"
                          onClick={() => setOpenGroup(null)}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition ${itemActive ? "border-gold/20 bg-gold/[0.08] text-gold" : "border-transparent text-white/55 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white"}`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${itemActive ? "border-gold/20 bg-gold/[0.08]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                            <ItemIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 truncate">{isArabic ? item.labelAr : item.labelEn}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
