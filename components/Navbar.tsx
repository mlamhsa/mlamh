"use client";

import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";

import { getDictionary, type Locale } from "@/lib/i18n";
import { useNotifications } from "@/hooks/useNotifications";
import { createClient } from "@supabase/supabase-js";

const navItems = [
  { key: "talents", ar: "المواهب", en: "Talents", href: "/talent" },
  { key: "opportunities", ar: "الفرص", en: "Opportunities", href: "/opportunities" },
  { key: "companies", ar: "الشركات", en: "Companies", href: "/publishers" },
  { key: "about", ar: "عن ملامح", en: "About", href: "#about" },
  { key: "contact", ar: "تواصل", en: "Contact", href: "#contact" },
];

export function Navbar({ locale }: { locale: Locale }) {
  const params = useParams();
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

  // ================= USER =================
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

  // ================= SCROLL =================
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ================= OUTSIDE CLICK =================
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

  // ================= LOGOUT =================
  async function handleLogout() {
    await supabase.auth.signOut();
    setUserId("");
    setProfileOpen(false);
    router.replace(`/${routeLocale}`);
  }

  function localizedHref(href: string) {
    if (href.startsWith("#")) return href;
    return `/${routeLocale}${href}`;
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
        
        {/* LOGO */}
        <Link href={`/${routeLocale}`}>
          <Image
            src={logoSrc}
            alt="MLAMH"
            width={180}
            height={60}
            className="object-contain"
          />
        </Link>

        {/* NAV */}
        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={localizedHref(item.href)}
              className="text-[11px] uppercase tracking-[0.24em] text-white/60 hover:text-gold"
            >
              {isAr ? item.ar : item.en}
            </Link>
          ))}
        </div>

        {/* RIGHT */}
        <div className="hidden items-center gap-3 lg:flex">

          {/* LANGUAGE */}
          <Link
            href={`/${targetLocale}`}
            className="rounded-full border border-white/10 px-4 py-3 text-[11px] text-white/60 hover:text-gold"
          >
            <Globe2 size={15} />
          </Link>

          {/* SEARCH */}
          <button className="h-11 w-11 rounded-full border border-white/10">
            <Search size={16} />
          </button>

          {/* AUTH */}
          {isLoggedIn ? (
            <>
              {/* NOTIFICATIONS */}
              <div ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen((v) => !v)}
                  className="relative h-11 w-11 rounded-full border border-white/10"
                >
                  <Bell size={16} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gold text-black text-[10px] px-1 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* PROFILE */}
              <div ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-gold"
                >
                  <User size={14} />
                  {isAr ? "حسابي" : "Account"}
                </button>

                {profileOpen && (
                  <div className="absolute mt-3 w-56 rounded-xl border border-white/10 bg-black p-2">
                    <Link href={`/${routeLocale}/dashboard-router`}>
                      {isAr ? "لوحة التحكم" : "Dashboard"}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="text-red-400"
                    >
                      {isAr ? "تسجيل الخروج" : "Logout"}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href={`/${routeLocale}/login`}>
                {isAr ? "دخول" : "Login"}
              </Link>
              <Link href={`/${routeLocale}/join`}>
                {isAr ? "ابدأ" : "Join"}
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU */}
        <button
          className="lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>
    </header>
  );
}