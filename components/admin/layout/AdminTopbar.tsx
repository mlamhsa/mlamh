"use client";

import Link from "next/link";

import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

import {
  usePathname,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

import {
  getAdminDictionary,
  getAdminLanguage,
  type AdminLanguage,
} from "@/lib/admin/i18n";

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
  const params =
    new URLSearchParams(
      searchParams.toString(),
    );

  params.set(
    "lang",
    language,
  );

  const query =
    params.toString();

  return query
    ? `${pathname}?${query}`
    : pathname;
}

export function AdminTopbar({
  onOpenMobileMenu,
  unreadAdminNotifications = 0,
}: AdminTopbarProps) {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const language =
    getAdminLanguage(
      searchParams.get("lang"),
    );

  const dictionary =
    getAdminDictionary(
      language,
    );

  const isArabic =
    language === "ar";

  const languageSwitchHref =
    buildLanguageSwitchHref({
      pathname,
      searchParams,
      language:
        isArabic
          ? "en"
          : "ar",
    });

  return (
    <header
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070707]/90 backdrop-blur-xl"
    >
      <div className="flex min-h-[72px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={
            onOpenMobileMenu
          }
          aria-label={
            isArabic
              ? "فتح قائمة الإدارة"
              : "Open admin menu"
          }
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-white/55 transition hover:border-gold/25 hover:text-gold lg:hidden"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>

        <form
          action="/admin/search"
          method="GET"
          className="relative hidden min-w-0 max-w-xl flex-1 md:block"
        >
          <input
            type="hidden"
            name="lang"
            value={language}
          />

          <Search
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 ${
              isArabic
                ? "right-4"
                : "left-4"
            }`}
          />

          <input
            type="search"
            name="q"
            defaultValue={
              pathname ===
              "/admin/search"
                ? searchParams.get(
                    "q",
                  ) ?? ""
                : ""
            }
            placeholder={
              isArabic
                ? "ابحث عن موهبة، ناشر، فرصة أو محادثة..."
                : "Search talents, publishers, opportunities, or conversations..."
            }
            autoComplete="off"
            className={`h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] text-sm text-white outline-none transition placeholder:text-white/25 focus:border-gold/30 ${
              isArabic
                ? "pr-11 pl-4"
                : "pl-11 pr-4"
            }`}
          />
        </form>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href={
              languageSwitchHref
            }
            aria-label={
              isArabic
                ? "تغيير اللغة إلى الإنجليزية"
                : "Switch language to Arabic"
            }
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.08] px-3 text-xs text-white/55 transition hover:border-gold/25 hover:text-gold"
          >
            {isArabic
              ? dictionary.common
                  .english
              : dictionary.common
                  .arabic}
          </Link>

          <Link
            href={`/admin/notifications?lang=${language}&recipient=ADMIN&status=unread`}
            aria-label={
              dictionary.common
                .notifications
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-white/55 transition hover:border-gold/25 hover:text-gold"
          >
            <Bell className="h-[18px] w-[18px]" />

            {unreadAdminNotifications >
            0 ? (
              <span className="absolute -end-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-medium text-black">
                {unreadAdminNotifications >
                99
                  ? "99+"
                  : unreadAdminNotifications}
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
                {
                  dictionary.layout
                    .systemAdmin
                }
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
  );
}