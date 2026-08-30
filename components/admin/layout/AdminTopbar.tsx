"use client";

import Link from "next/link";
import { useState } from "react";

import { Bell, Menu, Search, X } from "lucide-react";

import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import {
  getAdminDictionary,
  getAdminLanguage,
  withAdminLanguage,
  type AdminLanguage,
} from "@/lib/admin/i18n";
import { adminNavigation } from "./admin-navigation";

type AdminTopbarProps = {
  onOpenMobileMenu?: () => void;
  unreadAdminNotifications?: number;
};

function buildLanguageSwitchHref({
  pathname,
  searchParams,
  language,
}: {
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
  language: AdminLanguage;
}) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("lang", language);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminTopbar({
  onOpenMobileMenu,
  unreadAdminNotifications = 0,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const language = getAdminLanguage(searchParams.get("lang"));
  const dictionary = getAdminDictionary(language);
  const isArabic = language === "ar";

  const languageSwitchHref = buildLanguageSwitchHref({
    pathname,
    searchParams,
    language: isArabic ? "en" : "ar",
  });

  function openMobileMenu() {
    setMobileMenuOpen(true);
    onOpenMobileMenu?.();
  }

  return (
    <>
      <header
        dir={isArabic ? "rtl" : "ltr"}
        className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070707]/90 backdrop-blur-xl"
      >
        <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={openMobileMenu}
            aria-label={isArabic ? "فتح قائمة الإدارة" : "Open admin menu"}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-white/55 transition hover:border-gold/25 hover:text-gold lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <form
            action="/admin/search"
            method="GET"
            className="relative hidden min-w-0 max-w-xl flex-1 md:block"
          >
            <input type="hidden" name="lang" value={language} />

            <Search
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 ${
                isArabic ? "right-4" : "left-4"
              }`}
            />

            <input
              type="search"
              name="q"
              defaultValue={
                pathname === "/admin/search" ? searchParams.get("q") ?? "" : ""
              }
              placeholder={
                isArabic
                  ? "ابحث عن موهبة، ناشر، فرصة أو محادثة..."
                  : "Search talents, publishers, opportunities, or conversations..."
              }
              autoComplete="off"
              className={`h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] text-sm text-white outline-none transition placeholder:text-white/25 focus:border-gold/30 ${
                isArabic ? "pr-11 pl-4" : "pl-11 pr-4"
              }`}
            />
          </form>

          <div className="ms-auto flex items-center gap-2">
            <Link
              href={languageSwitchHref}
              aria-label={
                isArabic ? "تغيير اللغة إلى الإنجليزية" : "Switch language to Arabic"
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] px-3 text-xs text-white/55 transition hover:border-gold/25 hover:text-gold"
            >
              {isArabic ? dictionary.common.english : dictionary.common.arabic}
            </Link>

            <Link
              href={`/admin/notifications?lang=${language}&recipient=ADMIN&status=unread`}
              aria-label={dictionary.common.notifications}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-white/55 transition hover:border-gold/25 hover:text-gold"
            >
              <Bell className="h-[18px] w-[18px]" />

              {unreadAdminNotifications > 0 ? (
                <span className="absolute -end-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-medium text-black">
                  {unreadAdminNotifications > 99 ? "99+" : unreadAdminNotifications}
                </span>
              ) : null}
            </Link>

            <button
              type="button"
              className="flex min-h-10 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-start transition hover:border-gold/25"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-xs text-gold">
                A
              </span>

              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-xs text-white/75">
                  {dictionary.layout.systemAdmin}
                </span>
                <span
                  dir="ltr"
                  className="mt-0.5 block truncate text-[10px] text-white/30"
                >
                  admin@mlamh.com
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={isArabic ? "إغلاق قائمة الإدارة" : "Close admin menu"}
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          <aside
            dir={isArabic ? "rtl" : "ltr"}
            className={`absolute top-0 flex h-full w-[min(86vw,340px)] flex-col border-white/[0.08] bg-[#080808] shadow-2xl ${
              isArabic ? "right-0 border-l" : "left-0 border-r"
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#080808]/95 px-5 py-5 backdrop-blur-xl">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH</p>
                <p className="mt-1 text-lg font-light text-white">
                  {dictionary.layout.console}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={isArabic ? "إغلاق" : "Close"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-white/55"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
              {adminNavigation.map((group) => (
                <section key={group.titleEn}>
                  <p className="mb-2 px-3 text-[9px] uppercase tracking-[0.28em] text-white/25">
                    {isArabic ? group.titleAr : group.titleEn}
                  </p>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActiveRoute(pathname, item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={withAdminLanguage(item.href, language)}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex min-h-11 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                            active
                              ? "border-gold/20 bg-gold/[0.09] text-gold"
                              : "border-transparent text-white/55 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-white"
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px] shrink-0" />
                          <span>{isArabic ? item.labelAr : item.labelEn}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

            <div className="shrink-0 border-t border-white/[0.08] bg-[#080808] p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <AdminLogoutButton isArabic={isArabic} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
