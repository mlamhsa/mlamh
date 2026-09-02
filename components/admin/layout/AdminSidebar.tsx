"use client";

import Link from "next/link";
import { AdminLogoutButton } from "../AdminLogoutButton";
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { getAdminDictionary, getAdminLanguage, withAdminLanguage, type AdminLanguage } from "@/lib/admin/i18n";
import { adminNavigation, type AdminBadgeKey } from "./admin-navigation";

type AdminSidebarCounts = Partial<Record<AdminBadgeKey, number>>;
type AdminSidebarProps = { counts?: AdminSidebarCounts };

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildLanguageSwitchHref({ pathname, searchParams, language }: { pathname: string; searchParams: ReadonlyURLSearchParams; language: AdminLanguage; }) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("lang", language);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function AdminSidebar({ counts = {} }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const language = getAdminLanguage(searchParams.get("lang"));
  const dictionary = getAdminDictionary(language);
  const isArabic = language === "ar";
  const languageSwitchHref = buildLanguageSwitchHref({ pathname, searchParams, language: isArabic ? "en" : "ar" });

  return (
    <aside dir={isArabic ? "rtl" : "ltr"} className="hidden min-h-screen w-[286px] shrink-0 border-e border-white/[0.075] bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.055),transparent_28%),#080808] lg:sticky lg:top-0 lg:block lg:h-screen">
      <div className="flex h-full flex-col">
        <div className="px-5 pb-5 pt-6">
          <Link href={withAdminLanguage("/admin", language)} className="group relative block overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-4 shadow-[0_14px_35px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white/[0.045] active:translate-y-0">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent opacity-60" />
            <p className="text-[10px] uppercase tracking-[0.45em] text-gold">MLAMH</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-light text-white">{dictionary.layout.console}</p>
                <p className="mt-1 truncate text-xs text-white/35">{dictionary.layout.platformOperations}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-sm text-gold shadow-[0_0_24px_rgba(212,175,55,0.08)] transition-transform duration-200 group-hover:scale-105">M</span>
            </div>
          </Link>
        </div>

        <nav aria-label={isArabic ? "تنقل لوحة الإدارة" : "Admin navigation"} className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="space-y-7">
            {adminNavigation.map((group) => (
              <section key={group.titleEn}>
                <p className="mb-2 px-3 text-[9px] uppercase tracking-[0.28em] text-white/25">{isArabic ? group.titleAr : group.titleEn}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActiveRoute(pathname, item.href);
                    const Icon = item.icon;
                    const badgeValue = item.badgeKey ? counts[item.badgeKey] : undefined;
                    const href = withAdminLanguage(item.href, language);

                    return (
                      <Link key={item.href} href={href} aria-current={active ? "page" : undefined} className={`group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-180 focus-visible:ring-2 focus-visible:ring-gold/35 ${active ? "border-gold/25 bg-gradient-to-r from-gold/[0.12] to-gold/[0.045] text-gold shadow-[0_8px_24px_rgba(212,175,55,0.055)]" : "border-transparent text-white/50 hover:translate-x-[2px] hover:border-white/[0.07] hover:bg-white/[0.045] hover:text-white active:translate-x-0 active:scale-[0.99]"}`}>
                        {active ? <span className={`absolute ${isArabic ? "right-0" : "left-0"} top-2 bottom-2 w-[2px] rounded-full bg-gold shadow-[0_0_12px_rgba(212,175,55,0.7)]`} /> : null}
                        <Icon aria-hidden="true" className={`h-[18px] w-[18px] shrink-0 transition-all duration-180 ${active ? "text-gold" : "text-white/35 group-hover:scale-105 group-hover:text-white/75"}`} />
                        <span className="min-w-0 flex-1 truncate font-medium">{isArabic ? item.labelAr : item.labelEn}</span>
                        {typeof badgeValue === "number" && badgeValue > 0 ? (
                          <span className={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border px-1.5 text-[11px] font-semibold tabular-nums ${active ? "border-black/15 bg-gold text-black" : "border-gold/30 bg-gold/10 text-gold"}`} aria-label={isArabic ? `${badgeValue} بانتظار المراجعة` : `${badgeValue} pending`}>
                            {badgeValue > 99 ? "99+" : badgeValue}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-gold/10 text-sm text-gold">A</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white/80">{dictionary.layout.systemAdmin}</p>
                <p dir="ltr" className="mt-0.5 truncate text-xs text-white/30">admin@mlamh.com</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href={languageSwitchHref} aria-label={isArabic ? "تغيير اللغة إلى الإنجليزية" : "Switch language to Arabic"} className="rounded-xl border border-white/[0.08] px-3 py-2 text-center text-xs text-white/55 transition-all hover:-translate-y-0.5 hover:border-gold/25 hover:bg-white/[0.035] hover:text-gold active:translate-y-0">{isArabic ? dictionary.common.english : dictionary.common.arabic}</Link>
              <Link href="/" className="rounded-xl border border-white/[0.08] px-3 py-2 text-center text-xs text-white/55 transition-all hover:-translate-y-0.5 hover:border-gold/25 hover:bg-white/[0.035] hover:text-gold active:translate-y-0">{dictionary.common.viewSite}</Link>
            </div>
            <div className="mt-2"><AdminLogoutButton isArabic={isArabic} /></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
