"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CirclePlus,
  Home,
  LogIn,
  User,
  UserRound,
  UsersRound,
} from "lucide-react";

import type { Locale } from "@/lib/i18n";
import type { CurrentAccountType } from "@/hooks/useCurrentUser";

type MobileBottomNavigationProps = {
  locale: Locale;
  isLoggedIn: boolean;
  accountType: CurrentAccountType;
  authLoading: boolean;
};

type NavigationItem = {
  key: string;
  labelAr: string;
  labelEn: string;
  href: string;
  icon: typeof Home;
  active: boolean;
  primary?: boolean;
};

export function MobileBottomNavigation({
  locale,
  isLoggedIn,
  accountType,
  authLoading,
}: MobileBottomNavigationProps) {
  const pathname = usePathname();

  const portalReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isArabic = locale === "ar";

  function localizedPath(path: string) {
    return path === "/" ? `/${locale}` : `/${locale}${path}`;
  }

  function isActive(path: string) {
    const localized = localizedPath(path);

    if (path === "/") {
      return pathname === localized || pathname === `${localized}/`;
    }

    return pathname === localized || pathname.startsWith(`${localized}/`);
  }

  const navigationItems: NavigationItem[] = (() => {
    const home: NavigationItem = {
      key: "home",
      labelAr: "الرئيسية",
      labelEn: "Home",
      href: localizedPath("/"),
      icon: Home,
      active: isActive("/"),
    };

    const talents: NavigationItem = {
      key: "talents",
      labelAr: "المواهب",
      labelEn: "Talents",
      href: localizedPath("/talent"),
      icon: UsersRound,
      active: isActive("/talent"),
    };

    const opportunities: NavigationItem = {
      key: "opportunities",
      labelAr: "الفرص",
      labelEn: "Opportunities",
      href: localizedPath("/opportunities"),
      icon: BriefcaseBusiness,
      active:
        isActive("/opportunities") &&
        !isActive("/opportunities/new"),
    };

    const account: NavigationItem = {
      key: "account",
      labelAr: isLoggedIn ? "حسابي" : "دخول",
      labelEn: isLoggedIn ? "Account" : "Login",
      href: isLoggedIn
        ? localizedPath("/dashboard-router")
        : localizedPath("/login"),
      icon: isLoggedIn ? User : LogIn,
      active:
        pathname.includes("/dashboard-router") ||
        pathname.includes("/talent-dashboard") ||
        pathname.includes("/publisher-dashboard") ||
        pathname.includes("/login"),
    };

    if (authLoading) {
      return [
        home,
        talents,
        {
          key: "loading",
          labelAr: "ملامح",
          labelEn: "MLAMH",
          href: localizedPath("/"),
          icon: CirclePlus,
          active: false,
          primary: true,
        },
        opportunities,
        account,
      ];
    }

    if (accountType === "publisher") {
      return [
        home,
        talents,
        {
          key: "publish",
          labelAr: "نشر",
          labelEn: "Publish",
          href: localizedPath("/opportunities/new"),
          icon: CirclePlus,
          active: isActive("/opportunities/new"),
          primary: true,
        },
        opportunities,
        account,
      ];
    }

    if (accountType === "talent") {
      return [
        home,
        talents,
        {
          key: "profile",
          labelAr: "ملفي",
          labelEn: "My Profile",
          href: localizedPath("/dashboard-router"),
          icon: UserRound,
          active:
            pathname.includes("/dashboard-router") ||
            pathname.includes("/talent-dashboard/profile"),
          primary: true,
        },
        opportunities,
        account,
      ];
    }

    return [
      home,
      talents,
      {
        key: "join",
        labelAr: "انضم",
        labelEn: "Join",
        href: localizedPath("/join"),
        icon: CirclePlus,
        active: isActive("/join"),
        primary: true,
      },
      opportunities,
      account,
    ];
  })();

  if (!portalReady) {
    return null;
  }

  return createPortal(
    <nav
      dir={isArabic ? "rtl" : "ltr"}
      aria-label={
        isArabic
          ? "التنقل الرئيسي للجوال"
          : "Mobile primary navigation"
      }
      className="
        fixed
        inset-x-0
        bottom-0
        z-[9999]
        isolate
        block
        border-t
        border-white/10
        bg-black/95
        shadow-[0_-10px_35px_rgba(0,0,0,0.55)]
        backdrop-blur-2xl
        lg:hidden
      "
    >
      <div
        className="
          mx-auto
          grid
          h-[4.75rem]
          max-w-lg
          grid-cols-5
          items-center
          px-1
          pb-[max(env(safe-area-inset-bottom),0.35rem)]
        "
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const label = isArabic ? item.labelAr : item.labelEn;
          const disabled = item.key === "loading";

          if (item.primary) {
            const content = (
              <>
                <span
                  className={`
                    absolute
                    -top-6
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    border-4
                    border-black
                    text-black
                    shadow-xl
                    transition
                    ${
                      disabled
                        ? "bg-gold/50"
                        : item.active
                          ? "bg-white"
                          : "bg-gold"
                    }
                  `}
                >
                  <Icon size={26} strokeWidth={1.9} />
                </span>

                <span className="mt-8">{label}</span>
              </>
            );

            if (disabled) {
              return (
                <div
                  key={item.key}
                  aria-hidden="true"
                  className="
                    relative
                    flex
                    h-full
                    flex-col
                    items-center
                    justify-center
                    text-[10px]
                    font-medium
                    text-gold/50
                  "
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-label={label}
                aria-current={item.active ? "page" : undefined}
                className="
                  relative
                  flex
                  h-full
                  flex-col
                  items-center
                  justify-center
                  text-[10px]
                  font-medium
                  text-gold
                  transition
                  active:scale-95
                "
              >
                {content}
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-label={label}
              aria-current={item.active ? "page" : undefined}
              className={`
                flex
                h-full
                min-w-0
                flex-col
                items-center
                justify-center
                gap-1
                text-[10px]
                transition
                active:scale-95
                ${
                  item.active
                    ? "text-gold"
                    : "text-white/50"
                }
              `}
            >
              <Icon
                size={22}
                strokeWidth={item.active ? 2.2 : 1.7}
              />

              <span className="max-w-full truncate px-1">
                {label}
              </span>

              <span
                aria-hidden="true"
                className={`
                  h-1
                  w-1
                  rounded-full
                  ${
                    item.active
                      ? "bg-gold"
                      : "bg-transparent"
                  }
                `}
              />
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}
