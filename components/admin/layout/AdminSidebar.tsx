"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { usePathname, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";

import { AdminLogoutButton } from "../AdminLogoutButton";
import {
  getAdminDictionary,
  getAdminLanguage,
  withAdminLanguage,
  type AdminLanguage,
} from "@/lib/admin/i18n";
import {
  adminNavigation,
  isAdminRouteActive,
  type AdminBadgeKey,
} from "./admin-navigation";
import type { Permission } from "@/lib/rbac/permissions";

type AdminSidebarCounts = Partial<Record<AdminBadgeKey, number>>;

type AdminSidebarProps = {
  counts?: AdminSidebarCounts;
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

export function AdminSidebar({
  counts = {},
  permissions = [],
  adminEmail = null,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const activeGroupIds = useMemo(
    () =>
      new Set(
        visibleNavigation
          .filter((group) =>
            group.items.some((item) => isAdminRouteActive(pathname, item.href)),
          )
          .map((group) => group.id),
      ),
    [pathname, visibleNavigation],
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      adminNavigation.map((group) => [group.id, Boolean(group.defaultOpen)]),
    ),
  );

  const languageSwitchHref = buildLanguageSwitchHref({
    pathname,
    searchParams,
    language: isArabic ? "en" : "ar",
  });

  return (
    <aside
      dir={isArabic ? "rtl" : "ltr"}
      className="hidden h-screen w-[272px] shrink-0 border-e border-white/[0.07] bg-[#080808] lg:sticky lg:top-0 lg:flex lg:flex-col"
    >
      <div className="shrink-0 border-b border-white/[0.06] px-5 py-5">
        <Link
          href={withAdminLanguage("/admin", language)}
          className="group flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.08] text-sm font-semibold text-gold">
            M
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-medium uppercase tracking-[0.32em] text-gold">
              MLAMH
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-white/85">
              {dictionary.layout.console}
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label={isArabic ? "تنقل لوحة الإدارة" : "Admin navigation"}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-2">
          {visibleNavigation.map((group) => {
            const groupActive = activeGroupIds.has(group.id);
            const open = groupActive || expandedGroups[group.id];

            return (
              <section
                key={group.id}
                className={`rounded-xl border transition-colors ${
                  groupActive
                    ? "border-white/[0.075] bg-white/[0.018]"
                    : "border-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [group.id]: !current[group.id],
                    }))
                  }
                  aria-expanded={open}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-start"
                >
                  <span
                    className={`min-w-0 flex-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
                      groupActive ? "text-white/55" : "text-white/28"
                    }`}
                  >
                    {isArabic ? group.titleAr : group.titleEn}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 shrink-0 text-white/25 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open ? (
                  <div className="space-y-0.5 px-1.5 pb-2">
                    {group.items.map((item) => {
                      const active = isAdminRouteActive(pathname, item.href);
                      const Icon = item.icon;
                      const badgeValue = item.badgeKey ? counts[item.badgeKey] : undefined;

                      return (
                        <Link
                          key={item.href}
                          href={withAdminLanguage(item.href, language)}
                          aria-current={active ? "page" : undefined}
                          className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] outline-none transition-all focus-visible:ring-2 focus-visible:ring-gold/25 ${
                            active
                              ? "bg-gold/[0.09] text-gold"
                              : "text-white/48 hover:bg-white/[0.035] hover:text-white/85"
                          }`}
                        >
                          {active ? (
                            <span
                              className={`absolute ${
                                isArabic ? "right-0" : "left-0"
                              } inset-y-2 w-0.5 rounded-full bg-gold`}
                            />
                          ) : null}

                          <Icon
                            aria-hidden="true"
                            className={`h-[17px] w-[17px] shrink-0 ${
                              active
                                ? "text-gold"
                                : "text-white/30 group-hover:text-white/65"
                            }`}
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {isArabic ? item.labelAr : item.labelEn}
                          </span>

                          {typeof badgeValue === "number" && badgeValue > 0 ? (
                            <span
                              className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums ${
                                active
                                  ? "bg-gold text-black"
                                  : "bg-gold/10 text-gold"
                              }`}
                            >
                              {badgeValue > 99 ? "99+" : badgeValue}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/[0.08] text-xs font-semibold text-gold">
              {(adminEmail?.charAt(0) || "A").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white/72">
                {dictionary.layout.systemAdmin}
              </p>
              <p dir="ltr" className="mt-0.5 truncate text-[10px] text-white/28">
                {adminEmail ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={languageSwitchHref}
              className="rounded-lg border border-white/[0.07] px-2 py-2 text-center text-[11px] text-white/45 transition hover:border-gold/20 hover:text-gold"
            >
              {isArabic ? dictionary.common.english : dictionary.common.arabic}
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.07] px-2 py-2 text-[11px] text-white/45 transition hover:border-gold/20 hover:text-gold"
            >
              {dictionary.common.viewSite}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-2">
            <AdminLogoutButton isArabic={isArabic} />
          </div>
        </div>
      </div>
    </aside>
  );
}
