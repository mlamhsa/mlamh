"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CirclePlus,
  ClipboardList,
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
  const router = useRouter();

  const portalReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isArabic = locale === "ar";
  const isAuthUtilityRoute =
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/forgot-password` ||
    pathname === `/${locale}/reset-password`;

  function localizedPath(path: string) {
    return path === "/" ? `/${locale}` : `/${locale}${path}`;
  }

  function matches(path: string) {
    const localized = localizedPath(path);

    if (path === "/") {
      return pathname === localized || pathname === `${localized}/`;
    }

    return pathname === localized || pathname.startsWith(`${localized}/`);
  }

  function handleHomeClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const homePath = localizedPath("/");
    const onHome = pathname === homePath || pathname === `${homePath}/`;

    if (onHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push(homePath);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  const talentDashboardRoot = localizedPath("/talent-dashboard");
  const talentProfileActive =
    accountType === "talent" &&
    (pathname === talentDashboardRoot ||
      pathname === `${talentDashboardRoot}/` ||
      matches("/talent-dashboard/profile") ||
      matches("/talent-dashboard/gallery") ||
      matches("/talent-dashboard/claim"));

  const talentRequestsActive =
    accountType === "talent" && matches("/talent-dashboard/requests");

  const talentNotificationsActive =
    accountType === "talent" && matches("/talent-dashboard/notifications");

  const guestLoginActive = !isLoggedIn && matches("/login");
  const accountActive = isLoggedIn ? matches("/account") : guestLoginActive;

  const home: NavigationItem = {
    key: "home",
    labelAr: "الرئيسية",
    labelEn: "Home",
    href: localizedPath("/"),
    icon: Home,
    active: matches("/"),
  };

  const talents: NavigationItem = {
    key: "talents",
    labelAr: "المواهب",
    labelEn: "Talents",
    href: localizedPath("/talent"),
    icon: UsersRound,
    active: matches("/talent"),
  };

  const opportunities: NavigationItem = {
    key: "opportunities",
    labelAr: "الفرص",
    labelEn: "Opportunities",
    href: localizedPath("/opportunities"),
    icon: BriefcaseBusiness,
    active: matches("/opportunities") && !matches("/opportunities/new"),
  };

  const account: NavigationItem = {
    key: "account",
    labelAr: isLoggedIn ? "حسابي" : "دخول",
    labelEn: isLoggedIn ? "Account" : "Login",
    href: isLoggedIn ? localizedPath("/account") : localizedPath("/login"),
    icon: isLoggedIn ? User : LogIn,
    active: accountActive,
  };

  const navigationItems: NavigationItem[] = (() => {
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
          active: matches("/opportunities/new"),
          primary: true,
        },
        opportunities,
        account,
      ];
    }

    if (accountType === "talent") {
      return [
        home,
        opportunities,
        {
          key: "profile",
          labelAr: "ملفي",
          labelEn: "My Profile",
          href: localizedPath("/talent-dashboard/profile"),
          icon: UserRound,
          active: talentProfileActive,
          primary: true,
        },
        {
          key: "requests",
          labelAr: "طلباتي",
          labelEn: "Applications",
          href: localizedPath("/talent-dashboard/requests"),
          icon: ClipboardList,
          active: talentRequestsActive,
        },
        {
          key: "notifications",
          labelAr: "الإشعارات",
          labelEn: "Notifications",
          href: localizedPath("/talent-dashboard/notifications"),
          icon: Bell,
          active: talentNotificationsActive,
        },
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
        active: matches("/join"),
        primary: true,
      },
      opportunities,
      account,
    ];
  })();

  if (!portalReady || isAuthUtilityRoute) return null;

  return createPortal(
    <nav
      dir={isArabic ? "rtl" : "ltr"}
      aria-label={isArabic ? "التنقل الرئيسي للجوال" : "Mobile primary navigation"}
      className="fixed inset-x-0 bottom-0 z-[9999] isolate block border-t border-white/10 bg-black/95 shadow-[0_-10px_35px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:hidden"
    >
      <div className="mx-auto grid h-[4.75rem] max-w-lg grid-cols-5 items-center px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)]">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const label = isArabic ? item.labelAr : item.labelEn;
          const disabled = item.key === "loading";

          if (item.primary) {
            const isProfile = item.key === "profile";
            const circleClass = disabled
              ? "border-black bg-gold/50 text-black"
              : isProfile
                ? item.active
                  ? "border-black bg-gold text-black"
                  : "border-gold/30 bg-black text-gold"
                : item.active
                  ? "border-black bg-white text-black"
                  : "border-black bg-gold text-black";

            const content = (
              <>
                <span
                  className={`absolute -top-6 flex h-14 w-14 items-center justify-center rounded-full border-4 shadow-xl transition ${circleClass}`}
                >
                  <Icon size={26} strokeWidth={item.active ? 2.1 : 1.8} />
                </span>
                <span className={`mt-8 ${item.active || !isProfile ? "text-gold" : "text-white/50"}`}>
                  {label}
                </span>
              </>
            );

            if (disabled) {
              return (
                <div
                  key={item.key}
                  aria-hidden="true"
                  className="relative flex h-full flex-col items-center justify-center text-[10px] font-medium text-gold/50"
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
                className="relative flex h-full flex-col items-center justify-center text-[10px] font-medium transition active:scale-95"
              >
                {content}
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={item.key === "home" ? handleHomeClick : undefined}
              scroll={item.key === "home" ? true : undefined}
              aria-label={label}
              aria-current={item.active ? "page" : undefined}
              className={`flex h-full min-w-0 flex-col items-center justify-center gap-1 text-[10px] transition active:scale-95 ${
                item.active ? "text-gold" : "text-white/50"
              }`}
            >
              <Icon size={22} strokeWidth={item.active ? 2.2 : 1.7} />
              <span className="max-w-full truncate px-1">{label}</span>
              <span
                aria-hidden="true"
                className={`h-1 w-1 rounded-full ${
                  item.active ? "bg-gold" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}
