"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  FileText,
  Globe2,
  Info,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type { CurrentAccountType } from "@/hooks/useCurrentUser";
import { MobileBottomNavigation } from "@/components/mobile/MobileBottomNavigation";
import { MobileHeader } from "@/components/mobile/navigation/MobileHeader";

type MobileAppNavigationProps = {
  locale: Locale;
  isLoggedIn: boolean;
  accountType: CurrentAccountType;
  authLoading: boolean;
  menuOpen: boolean;
  languageHref: string;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onLogout: () => void | Promise<void>;
};

type DrawerItem = {
  key: string;
  labelAr: string;
  labelEn: string;
  href: string;
  icon: typeof UsersRound;
};

const mainItems: DrawerItem[] = [
  {
    key: "talents",
    labelAr: "المواهب",
    labelEn: "Talents",
    href: "/talent",
    icon: UsersRound,
  },
  {
    key: "opportunities",
    labelAr: "الفرص",
    labelEn: "Opportunities",
    href: "/opportunities",
    icon: BriefcaseBusiness,
  },
  {
    key: "companies",
    labelAr: "الشركات",
    labelEn: "Companies",
    href: "/publishers",
    icon: Building2,
  },
];

const supportItems: DrawerItem[] = [
  {
    key: "settings",
    labelAr: "الإعدادات",
    labelEn: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    key: "about",
    labelAr: "عن ملامح",
    labelEn: "About MLAMH",
    href: "/about",
    icon: Info,
  },
  {
    key: "contact",
    labelAr: "تواصل معنا",
    labelEn: "Contact Us",
    href: "/contact",
    icon: CircleHelp,
  },
  {
    key: "privacy",
    labelAr: "سياسة الخصوصية",
    labelEn: "Privacy Policy",
    href: "/privacy",
    icon: ShieldCheck,
  },
  {
    key: "terms",
    labelAr: "الشروط والأحكام",
    labelEn: "Terms & Conditions",
    href: "/terms",
    icon: FileText,
  },
];

export function MobileAppNavigation({
  locale,
  isLoggedIn,
  accountType,
  authLoading,
  menuOpen,
  languageHref,
  onMenuToggle,
  onMenuClose,
  onLogout,
}: MobileAppNavigationProps) {
  const isArabic = locale === "ar";

  function localizedHref(path: string) {
    return `/${locale}${path}`;
  }

  async function handleLogoutClick() {
    await onLogout();
    onMenuClose();
  }

  const accountLabel =
    accountType === "publisher"
      ? isArabic
        ? "لوحة الناشر"
        : "Publisher dashboard"
      : accountType === "talent"
        ? isArabic
          ? "مساحة الموهبة"
          : "Talent workspace"
        : isArabic
          ? "حسابي"
          : "Account";

  return (
    <>
      <header
        dir={isArabic ? "rtl" : "ltr"}
        className="
          fixed
          inset-x-0
          top-0
          z-[9000]
          border-b
          border-white/[0.08]
          bg-black/95
          shadow-[0_8px_30px_rgba(0,0,0,0.35)]
          backdrop-blur-2xl
          lg:hidden
        "
      >
        <div className="mx-auto flex h-16 w-full max-w-screen-sm items-center px-4">
          <MobileHeader
            locale={locale}
            isLoggedIn={isLoggedIn}
            menuOpen={menuOpen}
            onMenuToggle={onMenuToggle}
          />
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
          onClick={onMenuClose}
          className="
            fixed
            inset-0
            z-[9090]
            bg-black/65
            backdrop-blur-sm
            lg:hidden
          "
        />
      ) : null}

      <aside
        dir={isArabic ? "rtl" : "ltr"}
        aria-hidden={!menuOpen}
        className={`
          fixed
          bottom-0
          top-0
          z-[9100]
          flex
          w-[min(88vw,23rem)]
          flex-col
          overflow-hidden
          border-white/10
          bg-[#090909]
          shadow-2xl
          transition-transform
          duration-300
          ease-out
          lg:hidden
          ${
            isArabic
              ? `right-0 border-l ${
                  menuOpen ? "translate-x-0" : "translate-x-full"
                }`
              : `left-0 border-r ${
                  menuOpen ? "translate-x-0" : "-translate-x-full"
                }`
          }
        `}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div>
            <p className="text-sm font-semibold text-white">
              {isArabic ? "القائمة" : "Menu"}
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">
              {isArabic ? "تصفح ملامح" : "Explore MLAMH"}
            </p>
          </div>

          <button
            type="button"
            onClick={onMenuClose}
            aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
            className="
              inline-flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              text-white/70
              transition
              active:scale-95
              active:bg-white/10
            "
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            {mainItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={localizedHref(item.href)}
                  onClick={onMenuClose}
                  className="
                    flex
                    min-h-14
                    items-center
                    gap-4
                    rounded-2xl
                    border
                    border-white/[0.08]
                    bg-white/[0.035]
                    px-4
                    text-white
                    transition
                    active:scale-[0.99]
                    active:bg-white/[0.07]
                  "
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-gold">
                    <Icon size={19} />
                  </span>
                  <span className="text-sm font-medium">
                    {isArabic ? item.labelAr : item.labelEn}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="my-5 h-px bg-white/10" />

          <div className="space-y-1">
            {supportItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={localizedHref(item.href)}
                  onClick={onMenuClose}
                  className="
                    flex
                    min-h-12
                    items-center
                    gap-4
                    rounded-xl
                    px-3
                    text-sm
                    text-white/65
                    transition
                    active:bg-white/[0.06]
                    active:text-white
                  "
                >
                  <Icon size={18} className="shrink-0 text-white/45" />
                  <span>{isArabic ? item.labelAr : item.labelEn}</span>
                </Link>
              );
            })}

            <Link
              href={languageHref}
              onClick={onMenuClose}
              className="
                flex
                min-h-12
                items-center
                gap-4
                rounded-xl
                px-3
                text-sm
                text-white/65
                transition
                active:bg-white/[0.06]
                active:text-white
              "
            >
              <Globe2 size={18} className="shrink-0 text-white/45" />
              <span>{isArabic ? "English" : "العربية"}</span>
            </Link>
          </div>
        </div>

        <div
          className="
            shrink-0
            border-t
            border-white/10
            bg-black/70
            p-4
            pb-[max(env(safe-area-inset-bottom),1rem)]
          "
        >
          {authLoading ? (
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />
          ) : isLoggedIn ? (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/${locale}/dashboard-router`}
                onClick={onMenuClose}
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gold
                  px-3
                  text-sm
                  font-semibold
                  text-black
                  transition
                  active:scale-[0.98]
                "
              >
                <UserRound size={17} />
                {accountLabel}
              </Link>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-red-400/25
                  px-3
                  text-sm
                  text-red-300
                  transition
                  active:scale-[0.98]
                  active:bg-red-500/10
                "
              >
                <LogOut size={17} />
                {isArabic ? "خروج" : "Logout"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/${locale}/login`}
                onClick={onMenuClose}
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  px-3
                  text-sm
                  text-white
                  transition
                  active:scale-[0.98]
                  active:bg-white/[0.06]
                "
              >
                <LogIn size={17} />
                {isArabic ? "دخول" : "Login"}
              </Link>

              <Link
                href={`/${locale}/join`}
                onClick={onMenuClose}
                className="
                  flex
                  min-h-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-gold
                  px-3
                  text-sm
                  font-semibold
                  text-black
                  transition
                  active:scale-[0.98]
                "
              >
                {isArabic ? "ابدأ الآن" : "Join Now"}
              </Link>
            </div>
          )}
        </div>
      </aside>

      <MobileBottomNavigation
        locale={locale}
        isLoggedIn={isLoggedIn}
        accountType={accountType}
        authLoading={authLoading}
      />
    </>
  );
}
