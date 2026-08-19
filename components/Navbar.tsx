"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  FileText,
  Globe2,
  Info,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  UsersRound,
  X,
} from "lucide-react";
import {
  useParams,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import type { Locale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/client";

type NavigationItem = {
  key: string;
  ar: string;
  en: string;
  href: string;
  icon?: typeof UsersRound;
};
type NavbarNotification = {
  id: string | number;
  title?: string | null;
  body?: string | null;
};

const desktopNavigationItems: NavigationItem[] = [
  {
    key: "talents",
    ar: "المواهب",
    en: "Talents",
    href: "/talent",
  },
  {
    key: "opportunities",
    ar: "الفرص",
    en: "Opportunities",
    href: "/opportunities",
  },
  {
    key: "companies",
    ar: "الجهات",
    en: "Organizations",
    href: "/publishers",
  },
  {
    key: "how-it-works",
    ar: "كيف تعمل ملامح؟",
    en: "How it works",
    href: "#how-it-works",
  },
  {
    key: "about",
    ar: "عن ملامح",
    en: "About MLAMH",
    href: "#about",
  },
];

const exploreItems: NavigationItem[] = [
  {
    key: "talents",
    ar: "المواهب",
    en: "Talents",
    href: "/talent",
    icon: UsersRound,
  },
  {
    key: "opportunities",
    ar: "الفرص",
    en: "Opportunities",
    href: "/opportunities",
    icon: BriefcaseBusiness,
  },
  {
    key: "companies",
    ar: "الجهات",
    en: "Organizations",
    href: "/publishers",
    icon: Building2,
  },
];

const supportItems: NavigationItem[] = [
  {
    key: "about",
    ar: "عن ملامح",
    en: "About MLAMH",
    href: "/about",
    icon: Info,
  },
  {
    key: "contact",
    ar: "تواصل معنا",
    en: "Contact Us",
    href: "/contact",
    icon: CircleHelp,
  },
  {
    key: "privacy",
    ar: "سياسة الخصوصية",
    en: "Privacy Policy",
    href: "/privacy",
    icon: ShieldCheck,
  },
  {
    key: "terms",
    ar: "الشروط والأحكام",
    en: "Terms & Conditions",
    href: "/terms",
    icon: FileText,
  },
];

export function Navbar({ locale }: { locale: Locale }) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const routeLocale = (params?.locale as Locale) || locale;
  const isAr = routeLocale === "ar";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const {
    userId,
    isLoggedIn,
    accountType,
    userName,
    avatarUrl,
    loading,
  } = useCurrentUser();

  const { notifications } = useNotifications(userId);

  const logoSrc = isAr ? "/logo.ar.png" : "/logo.en.png";
  const targetLocale = isAr ? "en" : "ar";

  const localizedPathname = /^\/(ar|en)(?=\/|$)/.test(pathname)
    ? pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${targetLocale}`)
    : `/${targetLocale}${
        pathname.startsWith("/") ? pathname : `/${pathname}`
      }`;

  const queryString = searchParams.toString();
  const languageHref = queryString
    ? `${localizedPathname}?${queryString}`
    : localizedPathname;

  const dashboardHref =
    accountType === "admin"
      ? "/admin"
      : `/${routeLocale}/dashboard-router`;

  const profileHref =
    accountType === "publisher"
      ? `/${routeLocale}/publisher-dashboard/profile`
      : `/${routeLocale}/talent-dashboard/profile`;

  const settingsHref =
    accountType === "publisher"
      ? `/${routeLocale}/publisher-dashboard/settings`
      : `/${routeLocale}/talent-dashboard/settings`;

  const displayName =
    userName?.trim() || (isAr ? "حساب ملامح" : "MLAMH Account");

  const avatarInitial =
    displayName.trim().charAt(0).toUpperCase() || "M";

  const accountTypeLabel =
    accountType === "admin"
      ? isAr
        ? "مدير"
        : "Admin"
      : accountType === "publisher"
        ? isAr
          ? "ناشر"
          : "Publisher"
        : isAr
          ? "موهبة"
          : "Talent";

  const dashboardLabel =
    accountType === "admin"
      ? isAr
        ? "لوحة الإدارة"
        : "Admin Dashboard"
      : accountType === "publisher"
        ? isAr
          ? "لوحة الناشر"
          : "Publisher Dashboard"
        : isAr
          ? "لوحة الموهبة"
          : "Talent Dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () =>
      document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut();
  
    if (error) {
      console.error(
        "[Navbar.logout]",
        error,
      );
      return;
    }
  
    setProfileOpen(false);
    setNotificationsOpen(false);
    setMenuOpen(false);
  
    window.location.replace(
      `/${routeLocale}/login`,
    );
  }

  function localizedHref(href: string) {
    if (href.startsWith("#")) {
      return `/${routeLocale}${href}`;
    }
  
    return `/${routeLocale}${href}`;
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header
        dir={isAr ? "rtl" : "ltr"}
        className={`fixed inset-x-0 top-0 z-[100] border-b transition-all duration-500 ${
          scrolled || menuOpen
            ? "border-white/10 bg-black/90 backdrop-blur-2xl"
            : "border-white/[0.06] bg-black/70 backdrop-blur-xl"
        }`}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:h-24 lg:px-8">
        <Link
  href={`/${routeLocale}`}
  onClick={closeMobileMenu}
  className="flex h-full shrink-0 items-center"
>
  <Image
    src={logoSrc}
    alt="MLAMH"
    width={220}
    height={90}
    priority
    className="block h-auto max-h-14 w-auto object-contain sm:max-h-16 lg:max-h-[4.5rem]"
  />
</Link>

<div className="hidden items-center gap-1 lg:flex">
  {desktopNavigationItems.map((item) => {
    const href = localizedHref(item.href);

    const isActive =
      !item.href.startsWith("#") &&
      pathname === `/${routeLocale}${item.href}`;

    return (
      <Link
        key={item.key}
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={[
          "relative rounded-full px-4 py-2.5 text-[13px] font-medium transition-all duration-300",
          isAr
            ? "tracking-normal"
            : "tracking-[0.02em]",
          isActive
            ? "bg-white/[0.06] text-gold"
            : "text-white/60 hover:bg-white/[0.035] hover:text-white",
        ].join(" ")}
      >
        {isAr ? item.ar : item.en}

        {isActive ? (
          <span className="absolute inset-x-4 -bottom-[1px] h-px bg-gold" />
        ) : null}
      </Link>
    );
  })}
</div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href={languageHref}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-gold/40 hover:text-gold"
              aria-label={
                isAr ? "تغيير اللغة" : "Change language"
              }
            >
              <Globe2 size={15} />
            </Link>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-gold/40 hover:text-gold"
              aria-label={isAr ? "بحث" : "Search"}
            >
              <Search size={16} />
            </button>

            {!loading && isLoggedIn ? (
              <>
                <div
                  ref={notificationsRef}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(
                        (value) => !value,
                      )
                    }
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-gold/40 hover:text-gold"
                    aria-label={
                      isAr ? "الإشعارات" : "Notifications"
                    }
                  >
                    <Bell size={16} />

                    {notifications.length > 0 ? (
                      <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1 text-[10px] text-black">
                        {notifications.length}
                      </span>
                    ) : null}
                  </button>

                  {notificationsOpen ? (
                    <div className="absolute mt-3 w-72 rounded-2xl border border-white/10 bg-black p-4 shadow-2xl">
                      <p
                        className={`mb-3 text-xs text-gold ${
                          isAr
                            ? "tracking-normal"
                            : "uppercase tracking-[0.25em]"
                        }`}
                      >
                        {isAr
                          ? "الإشعارات"
                          : "Notifications"}
                      </p>

                      {notifications.length > 0 ? (
                        <div className="space-y-3">
                          {notifications
                            .slice(0, 5)
                            .map((item: NavbarNotification) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                              >
                                <p className="text-sm tracking-normal text-white">
                                  {item.title ??
                                    (isAr
                                      ? "إشعار"
                                      : "Notification")}
                                </p>

                                {item.body ? (
                                  <p className="mt-1 text-xs tracking-normal text-white/45">
                                    {item.body}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm tracking-normal text-white/45">
                          {isAr
                            ? "لا توجد إشعارات"
                            : "No notifications"}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setProfileOpen((value) => !value)
                    }
                    className="flex items-center gap-2 rounded-full border border-gold/30 py-1.5 pe-4 ps-1.5 tracking-normal text-gold transition hover:bg-gold/10"
                  >
                    <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gold/30 bg-gold/10">
                      {avatarUrl ? (
                        // A normal img supports arbitrary Supabase storage hosts.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-gold">
                          {avatarInitial}
                        </span>
                      )}
                    </span>

                    <span className="max-w-28 truncate text-sm">
                      {displayName}
                    </span>
                  </button>

                  {profileOpen ? (
  <div className="absolute mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black p-2 shadow-2xl">
    <div className="border-b border-white/10 px-3 py-3">
      <p className="truncate text-sm font-semibold text-white">
        {displayName}
      </p>

      <span className="mt-2 inline-flex items-center rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold">
        {accountTypeLabel}
      </span>
    </div>

    <div className="mt-2 space-y-1">
      <Link
        href={dashboardHref}
        onClick={() => setProfileOpen(false)}
        aria-current={
          pathname.includes("/dashboard") &&
          !pathname.includes("/profile") &&
          !pathname.includes("/settings")
            ? "page"
            : undefined
        }
        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm tracking-normal transition ${
          pathname.includes("/dashboard") &&
          !pathname.includes("/profile") &&
          !pathname.includes("/settings")
            ? "border border-gold/20 bg-gold/10 text-gold"
            : "border border-transparent text-white/70 hover:bg-white/5 hover:text-gold"
        }`}
      >
        <LayoutDashboard size={16} />
        <span className="flex-1">{dashboardLabel}</span>

        {pathname.includes("/dashboard") &&
        !pathname.includes("/profile") &&
        !pathname.includes("/settings") ? (
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
        ) : null}
      </Link>

      {accountType !== "admin" ? (
        <>
          <Link
            href={profileHref}
            onClick={() => setProfileOpen(false)}
            aria-current={
              pathname.includes("/profile") ? "page" : undefined
            }
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm tracking-normal transition ${
              pathname.includes("/profile")
                ? "border border-gold/20 bg-gold/10 text-gold"
                : "border border-transparent text-white/70 hover:bg-white/5 hover:text-gold"
            }`}
          >
            <UserCircle size={16} />
            <span className="flex-1">
              {isAr ? "الملف الشخصي" : "Profile"}
            </span>

            {pathname.includes("/profile") ? (
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            ) : null}
          </Link>

          <Link
            href={settingsHref}
            onClick={() => setProfileOpen(false)}
            aria-current={
              pathname.includes("/settings") ? "page" : undefined
            }
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm tracking-normal transition ${
              pathname.includes("/settings")
                ? "border border-gold/20 bg-gold/10 text-gold"
                : "border border-transparent text-white/70 hover:bg-white/5 hover:text-gold"
            }`}
          >
            <Settings size={16} />
            <span className="flex-1">
              {isAr ? "الإعدادات" : "Settings"}
            </span>

            {pathname.includes("/settings") ? (
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            ) : null}
          </Link>
        </>
      ) : null}
    </div>

    <div className="mx-2 my-2 h-px bg-white/10" />

    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm tracking-normal text-red-400 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
    >
      <LogOut size={16} />
      {isAr ? "تسجيل الخروج" : "Logout"}
    </button>
  </div>
) : null}
                </div>
              </>
            ) : !loading ? (
              <>
                <Link
                  href={`/${routeLocale}/login`}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm tracking-normal text-white/70 transition hover:border-gold/40 hover:text-gold"
                >
                  {isAr ? "دخول" : "Login"}
                </Link>

                <Link
                  href={`/${routeLocale}/join`}
                  className="rounded-full bg-gold px-5 py-3 text-sm tracking-normal text-black transition hover:bg-gold-soft"
                >
                  {isAr ? "ابدأ" : "Join"}
                </Link>
              </>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-gold/40 hover:text-gold lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={
              menuOpen
                ? isAr
                  ? "إغلاق القائمة"
                  : "Close menu"
                : isAr
                  ? "فتح القائمة"
                  : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </header>

      {menuOpen ? (
        <button
          type="button"
          aria-label={
            isAr ? "إغلاق القائمة" : "Close menu"
          }
          onClick={closeMobileMenu}
          className="fixed inset-0 z-[101] bg-black/65 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        id="mobile-navigation-drawer"
        dir={isAr ? "rtl" : "ltr"}
        aria-hidden={!menuOpen}
        className={`fixed bottom-0 top-0 z-[102] flex w-[min(88vw,23rem)] flex-col overflow-hidden border-white/10 bg-[#090909] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isAr
            ? `right-0 border-l ${
                menuOpen
                  ? "translate-x-0"
                  : "translate-x-full"
              }`
            : `left-0 border-r ${
                menuOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
              }`
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Image
            src={logoSrc}
            alt="MLAMH"
            width={180}
            height={72}
            className="h-auto w-36"
          />

          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label={
              isAr ? "إغلاق القائمة" : "Close menu"
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition active:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
        {!loading && isLoggedIn ? (
  <section>
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gold/30 bg-gold/10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gold">
              {avatarInitial}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {displayName}
          </p>

          <span className="mt-2 inline-flex items-center rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[11px] font-medium text-gold">
            {accountTypeLabel}
          </span>
        </div>
      </div>

      <Link
        href={dashboardHref}
        onClick={closeMobileMenu}
        aria-current={
          pathname.includes("/dashboard") &&
          !pathname.includes("/profile") &&
          !pathname.includes("/settings")
            ? "page"
            : undefined
        }
        className={`mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition active:scale-[0.98] ${
          pathname.includes("/dashboard") &&
          !pathname.includes("/profile") &&
          !pathname.includes("/settings")
            ? "border-gold bg-gold text-black"
            : "border-gold/30 bg-gold/10 text-gold active:bg-gold/15"
        }`}
      >
        <LayoutDashboard size={17} />
        {dashboardLabel}
      </Link>
    </div>

    {accountType !== "admin" ? (
      <div className="mt-3 space-y-1">
        <Link
          href={profileHref}
          onClick={closeMobileMenu}
          aria-current={
            pathname.includes("/profile") ? "page" : undefined
          }
          className={`flex min-h-12 items-center gap-4 rounded-xl border px-3 text-sm transition active:scale-[0.99] ${
            pathname.includes("/profile")
              ? "border-gold/20 bg-gold/10 text-gold"
              : "border-transparent text-white/75 active:bg-white/[0.06] active:text-white"
          }`}
        >
          <UserCircle
            size={18}
            className={`shrink-0 ${
              pathname.includes("/profile")
                ? "text-gold"
                : "text-white/45"
            }`}
          />

          <span className="flex-1">
            {isAr ? "الملف الشخصي" : "Profile"}
          </span>

          {pathname.includes("/profile") ? (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          ) : null}
        </Link>

        <Link
          href={settingsHref}
          onClick={closeMobileMenu}
          aria-current={
            pathname.includes("/settings") ? "page" : undefined
          }
          className={`flex min-h-12 items-center gap-4 rounded-xl border px-3 text-sm transition active:scale-[0.99] ${
            pathname.includes("/settings")
              ? "border-gold/20 bg-gold/10 text-gold"
              : "border-transparent text-white/75 active:bg-white/[0.06] active:text-white"
          }`}
        >
          <Settings
            size={18}
            className={`shrink-0 ${
              pathname.includes("/settings")
                ? "text-gold"
                : "text-white/45"
            }`}
          />

          <span className="flex-1">
            {isAr ? "الإعدادات" : "Settings"}
          </span>

          {pathname.includes("/settings") ? (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          ) : null}
        </Link>
      </div>
    ) : null}

    <div className="my-5 h-px bg-white/10" />
  </section>
) : null}

          <section>
            <p className="mb-3 px-1 text-[11px] font-semibold text-white/35">
              {isAr ? "استكشف" : "EXPLORE"}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {exploreItems.map((item) => {
                const Icon = item.icon ?? UsersRound;

                return (
                  <Link
                    key={item.key}
                    href={localizedHref(item.href)}
                    onClick={closeMobileMenu}
                    className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-2 text-center text-xs text-white/75 transition active:scale-[0.98] active:border-gold/30 active:text-gold"
                  >
                    <Icon size={21} className="text-gold" />
                    <span>{isAr ? item.ar : item.en}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="my-5 h-px bg-white/10" />

          <section>
            <p className="mb-2 px-3 text-[11px] font-semibold text-white/35">
              {isAr ? "الدعم" : "SUPPORT"}
            </p>

            <div className="space-y-1">
              {supportItems.map((item) => {
                const Icon = item.icon ?? Info;

                return (
                  <Link
                    key={item.key}
                    href={localizedHref(item.href)}
                    onClick={closeMobileMenu}
                    className="flex min-h-12 items-center gap-4 rounded-xl px-3 text-sm text-white/65 transition active:bg-white/[0.06] active:text-white"
                  >
                    <Icon
                      size={18}
                      className="shrink-0 text-white/35"
                    />
                    <span>{isAr ? item.ar : item.en}</span>
                  </Link>
                );
              })}

              <Link
                href={languageHref}
                onClick={closeMobileMenu}
                className="flex min-h-12 items-center gap-4 rounded-xl px-3 text-sm text-white/65 transition active:bg-white/[0.06] active:text-white"
              >
                <Globe2
                  size={18}
                  className="shrink-0 text-white/35"
                />
                <span>{isAr ? "English" : "العربية"}</span>
              </Link>
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {!loading && isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/25 text-sm text-red-300 transition active:scale-[0.98] active:bg-red-500/10"
            >
              <LogOut size={17} />
              {isAr ? "تسجيل الخروج" : "Logout"}
            </button>
          ) : !loading ? (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/${routeLocale}/login`}
                onClick={closeMobileMenu}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-white transition active:scale-[0.98] active:bg-white/[0.06]"
              >
                <LogIn size={17} />
                {isAr ? "دخول" : "Login"}
              </Link>

              <Link
                href={`/${routeLocale}/join`}
                onClick={closeMobileMenu}
                className="flex min-h-12 items-center justify-center rounded-xl bg-gold px-3 text-sm font-semibold text-black transition active:scale-[0.98]"
              >
                {isAr ? "انضم الآن" : "Join Now"}
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
