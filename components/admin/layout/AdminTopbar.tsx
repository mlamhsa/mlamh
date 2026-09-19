"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import {
  adminNavigation,
  getActiveAdminNavigation,
  isAdminRouteActive,
  type AdminBadgeKey,
} from "./admin-navigation";
import type { Permission } from "@/lib/rbac/permissions";

type AdminTopbarCounts = Partial<Record<AdminBadgeKey, number>>;

type AdminTopbarProps = {
  onOpenMobileMenu?: () => void;
  unreadAdminNotifications?: number;
  counts?: AdminTopbarCounts;
  permissions?: Permission[];
  adminEmail?: string | null;
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

export function AdminTopbar({
  onOpenMobileMenu,
  unreadAdminNotifications = 0,
  counts = {},
  permissions = [],
  adminEmail = null,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const language = getAdminLanguage(searchParams.get("lang"));
  const dictionary = getAdminDictionary(language);
  const isArabic = language === "ar";
  const permissionSet = useMemo(() => new Set<Permission>(permissions), [permissions]);

  const visibleNavigation = useMemo(
    () =>
      adminNavigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              !item.requiredPermission || permissionSet.has(item.requiredPermission),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [permissionSet],
  );

  const activeNavigation = getActiveAdminNavigation(pathname);
  const activeItem =
    activeNavigation &&
    (!activeNavigation.item.requiredPermission ||
      permissionSet.has(activeNavigation.item.requiredPermission))
      ? activeNavigation
      : null;

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
        className="sticky top-0 z-40 border-b border-white/[0.065] bg-[#070707]/92 backdrop-blur-xl"
      >
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-7">
          <button
            type="button"
            onClick={openMobileMenu}
            aria-label={isArabic ? "فتح قائمة الإدارة" : "Open admin menu"}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-white/55 transition hover:border-gold/25 hover:text-gold lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>

          <div className="hidden min-w-0 shrink-0 xl:block">
            <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
              {activeItem
                ? isArabic
                  ? activeItem.group.titleAr
                  : activeItem.group.titleEn
                : isArabic
                  ? "لوحة الإدارة"
                  : "Admin"}
            </p>
            <p className="mt-0.5 max-w-[180px] truncate text-sm font-medium text-white/72">
              {activeItem
                ? isArabic
                  ? activeItem.item.labelAr
                  : activeItem.item.labelEn
                : dictionary.layout.console}
            </p>
          </div>

          <form
            action="/admin/search"
            method="GET"
            className="relative hidden min-w-0 max-w-[560px] flex-1 md:block xl:ms-5"
          >
            <input type="hidden" name="lang" value={language} />
            <Search
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/28 ${
                isArabic ? "right-3.5" : "left-3.5"
              }`}
            />
            <input
              type="search"
              name="q"
              defaultValue={pathname === "/admin/search" ? searchParams.get("q") ?? "" : ""}
              placeholder={
                isArabic
                  ? "بحث شامل: موهبة، ناشر، فرصة، محادثة..."
                  : "Search talents, publishers, opportunities, conversations..."
              }
              autoComplete="off"
              className={`h-10 w-full rounded-lg border border-white/[0.07] bg-white/[0.02] text-[13px] text-white outline-none transition placeholder:text-white/22 focus:border-gold/25 focus:bg-white/[0.03] ${
                isArabic ? "pr-10 pl-3" : "pl-10 pr-3"
              }`}
            />
          </form>

          <div className="ms-auto flex items-center gap-2">
            <Link
              href={withAdminLanguage("/admin/action-center", language)}
              className="hidden h-10 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 text-xs text-white/48 transition hover:border-gold/20 hover:text-gold sm:flex"
            >
              <span>{isArabic ? "الإجراءات" : "Actions"}</span>
              {(counts.pendingActions ?? 0) > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-gold px-1.5 text-[10px] font-semibold tabular-nums text-black">
                  {(counts.pendingActions ?? 0) > 99 ? "99+" : counts.pendingActions}
                </span>
              ) : null}
            </Link>

            <Link
              href={languageSwitchHref}
              aria-label={isArabic ? "تغيير اللغة إلى الإنجليزية" : "Switch language to Arabic"}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.07] px-3 text-[11px] font-medium text-white/45 transition hover:border-gold/20 hover:text-gold"
            >
              {isArabic ? "EN" : "AR"}
            </Link>

            <Link
              href={`/admin/notifications?lang=${language}&recipient=ADMIN&status=unread`}
              aria-label={dictionary.common.notifications}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.07] text-white/48 transition hover:border-gold/20 hover:text-gold"
            >
              <Bell className="h-[17px] w-[17px]" />
              {unreadAdminNotifications > 0 ? (
                <span className="absolute -end-1 -top-1 inline-flex min-w-4.5 items-center justify-center rounded-full bg-gold px-1 py-0.5 text-[8px] font-semibold text-black">
                  {unreadAdminNotifications > 99 ? "99+" : unreadAdminNotifications}
                </span>
              ) : null}
            </Link>

            <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.018] px-2 py-1.5 lg:flex">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gold/[0.08] text-[10px] font-semibold text-gold">
                {(adminEmail?.charAt(0) || "A").toUpperCase()}
              </span>
              <span className="max-w-[160px] truncate text-[11px] text-white/42" dir="ltr">
                {adminEmail ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={isArabic ? "إغلاق قائمة الإدارة" : "Close admin menu"}
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/78 backdrop-blur-sm"
          />

          <aside
            dir={isArabic ? "rtl" : "ltr"}
            className={`absolute top-0 flex h-full w-[min(91vw,380px)] flex-col border-white/[0.08] bg-[#080808] shadow-2xl ${
              isArabic ? "right-0 border-l" : "left-0 border-r"
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.08] text-xs font-semibold text-gold">
                  M
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.28em] text-gold">MLAMH</p>
                  <p className="mt-0.5 text-sm font-medium text-white/82">
                    {dictionary.layout.console}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={isArabic ? "إغلاق" : "Close"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-white/50"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
              <form action="/admin/search" method="GET" className="relative">
                <input type="hidden" name="lang" value={language} />
                <Search
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/28 ${
                    isArabic ? "right-3.5" : "left-3.5"
                  }`}
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={pathname === "/admin/search" ? searchParams.get("q") ?? "" : ""}
                  placeholder={isArabic ? "ابحث في لوحة الإدارة..." : "Search admin workspace..."}
                  autoComplete="off"
                  className={`h-10 w-full rounded-lg border border-white/[0.07] bg-white/[0.02] text-[13px] text-white outline-none placeholder:text-white/22 focus:border-gold/25 ${
                    isArabic ? "pr-10 pl-3" : "pl-10 pr-3"
                  }`}
                />
              </form>
            </div>

            <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
              {visibleNavigation.map((group) => (
                <section key={group.id}>
                  <p className="mb-1.5 px-2 text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                    {isArabic ? group.titleAr : group.titleEn}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isAdminRouteActive(pathname, item.href);
                      const Icon = item.icon;
                      const badgeValue = item.badgeKey ? counts[item.badgeKey] : undefined;

                      return (
                        <Link
                          key={item.href}
                          href={withAdminLanguage(item.href, language)}
                          onClick={() => setMobileMenuOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
                            active
                              ? "bg-gold/[0.09] text-gold"
                              : "text-white/50 hover:bg-white/[0.035] hover:text-white"
                          }`}
                        >
                          <Icon className="h-[17px] w-[17px] shrink-0" />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {isArabic ? item.labelAr : item.labelEn}
                          </span>
                          {typeof badgeValue === "number" && badgeValue > 0 ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-gold/10 px-1.5 text-[10px] font-semibold text-gold">
                              {badgeValue > 99 ? "99+" : badgeValue}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

            <div className="shrink-0 border-t border-white/[0.07] p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <p dir="ltr" className="mb-3 truncate text-[11px] text-white/30">
                {adminEmail ?? "—"}
              </p>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <Link
                  href={languageSwitchHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-white/[0.07] px-3 py-2 text-center text-[11px] text-white/45 transition hover:border-gold/20 hover:text-gold"
                >
                  {isArabic ? dictionary.common.english : dictionary.common.arabic}
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg border border-white/[0.07] px-3 py-2 text-center text-[11px] text-white/45 transition hover:border-gold/20 hover:text-gold"
                >
                  {dictionary.common.viewSite}
                </Link>
              </div>
              <AdminLogoutButton isArabic={isArabic} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
