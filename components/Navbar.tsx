"use client";

import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Globe2, Menu, Search, User, X } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { key: "talents", ar: "المواهب", en: "Talents", href: "/talent" },
  { key: "opportunities", ar: "الفرص", en: "Opportunities", href: "/opportunities" },
  { key: "companies", ar: "الشركات", en: "Companies", href: "/publishers" },
  { key: "about", ar: "عن ملامح", en: "About", href: "#about" },
  { key: "contact", ar: "تواصل", en: "Contact", href: "#contact" },
];

export function Navbar({ locale }: { locale: Locale }) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const routeLocale = (params?.locale as Locale) || locale;
  const isAr = routeLocale === "ar";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userId, setUserId] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { notifications } = useNotifications(userId);
  const isLoggedIn = Boolean(userId);

  const logoSrc = isAr ? "/logo.ar.png" : "/logo.en.png";
  const targetLocale = isAr ? "en" : "ar";

  const localizedPathname = /^\/(ar|en)(?=\/|$)/.test(pathname)
    ? pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${targetLocale}`)
    : `/${targetLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

  const queryString = searchParams.toString();
  const languageHref = queryString
    ? `${localizedPathname}?${queryString}`
    : localizedPathname;

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? "");
    };

    loadUser();

    const { data } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
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
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserId("");
    setProfileOpen(false);
    setMenuOpen(false);
    router.replace(`/${routeLocale}`);
  }

  function localizedHref(href: string) {
    if (href.startsWith("#")) return href;
    return `/${routeLocale}${href}`;
  }

  function closeMobileMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      dir={isAr ? "rtl" : "ltr"}
      className={`fixed inset-x-0 top-0 z-[100] border-b transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-white/10 bg-black/90 backdrop-blur-2xl"
          : "border-white/[0.06] bg-black/70 backdrop-blur-xl"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:h-24 lg:px-8">
        <Link href={`/${routeLocale}`} onClick={closeMobileMenu}>
        <Image
  src={isAr ? "/logo.ar.png" : "/logo.en.png"}
  alt="MLAMH"
  width={220}
  height={90}
  priority
  className="h-auto w-40 sm:w-52"
/>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={localizedHref(item.href)}
              className={`text-[11px] text-white/60 transition hover:text-gold ${
                isAr
                  ? "tracking-normal"
                  : "uppercase tracking-[0.24em]"
              }`}
            >
              {isAr ? item.ar : item.en}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={languageHref}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-gold/40 hover:text-gold"
            aria-label={isAr ? "تغيير اللغة" : "Change language"}
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

          {isLoggedIn ? (
            <>
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((value) => !value)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-gold/40 hover:text-gold"
                  aria-label={isAr ? "الإشعارات" : "Notifications"}
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
                      {isAr ? "الإشعارات" : "Notifications"}
                    </p>

                    {notifications.length > 0 ? (
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((item: any) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                          >
                            <p className="text-sm tracking-normal text-white">
                              {item.title ?? (isAr ? "إشعار" : "Notification")}
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
                        {isAr ? "لا توجد إشعارات" : "No notifications"}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 tracking-normal text-gold transition hover:bg-gold/10"
                >
                  <User size={14} />
                  {isAr ? "حسابي" : "Account"}
                </button>

                {profileOpen ? (
                  <div className="absolute mt-3 w-56 rounded-2xl border border-white/10 bg-black p-2 shadow-2xl">
                    <Link
                      href={`/${routeLocale}/dashboard-router`}
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-sm tracking-normal text-white/70 transition hover:bg-white/5 hover:text-gold"
                    >
                      {isAr ? "لوحة التحكم" : "Dashboard"}
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-4 py-3 text-start text-sm tracking-normal text-red-400 transition hover:bg-red-500/10"
                    >
                      {isAr ? "تسجيل الخروج" : "Logout"}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
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
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-gold/40 hover:text-gold lg:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? (isAr ? "إغلاق القائمة" : "Close menu") : isAr ? "فتح القائمة" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-x-0 top-20 z-[99] max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-white/10 bg-black/95 px-5 py-6 shadow-2xl backdrop-blur-2xl lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={localizedHref(item.href)}
                onClick={closeMobileMenu}
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 text-lg tracking-normal text-white transition active:scale-[0.99] hover:border-gold/40 hover:text-gold"
              >
                {isAr ? item.ar : item.en}
              </Link>
            ))}

            <div className="my-3 h-px bg-white/10" />

            {isLoggedIn ? (
              <>
                <Link
                  href={`/${routeLocale}/dashboard-router`}
                  onClick={closeMobileMenu}
                  className="rounded-2xl bg-gold px-5 py-4 text-center text-base font-medium tracking-normal text-black"
                >
                  {isAr ? "لوحة التحكم" : "Dashboard"}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl border border-red-400/30 px-5 py-4 text-center text-base tracking-normal text-red-300"
                >
                  {isAr ? "تسجيل الخروج" : "Logout"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${routeLocale}/login`}
                  onClick={closeMobileMenu}
                  className="rounded-2xl border border-white/10 px-5 py-4 text-center text-base tracking-normal text-white"
                >
                  {isAr ? "دخول" : "Login"}
                </Link>

                <Link
                  href={`/${routeLocale}/join`}
                  onClick={closeMobileMenu}
                  className="rounded-2xl bg-gold px-5 py-4 text-center text-base font-medium tracking-normal text-black"
                >
                  {isAr ? "ابدأ الآن" : "Join Now"}
                </Link>
              </>
            )}

            <Link
              href={languageHref}
              onClick={closeMobileMenu}
              className="rounded-2xl border border-white/10 px-5 py-4 text-center text-base tracking-normal text-white/70"
            >
              {isAr ? "English" : "العربية"}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}