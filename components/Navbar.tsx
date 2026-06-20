"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDictionary, type Locale } from "@/lib/i18n";

import { useNotifications } from "@/hooks/useNotifications";
import Image from "next/image";

import { supabase } from "@/lib/supabase/client";

const navHrefs = [
  { key: "talents" as const, href: "#talents" },
  { key: "opportunities" as const, href: "/opportunities" },
  { key: "agencies" as const, href: "#agencies" },
  { key: "about" as const, href: "#about" },
  { key: "contact" as const, href: "#contact" },
];

export function Navbar({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const { nav } = dict;

  const targetLocale = locale === "ar" ? "en" : "ar";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const talentJoinLabel =
    locale === "ar" ? "انضم كموهبة" : "Join as Talent";

  const publisherJoinLabel =
    locale === "ar" ? "للشركات والوكالات" : "For Companies & Agencies";

  const opportunitiesLabel =
    locale === "ar" ? "الفرص" : "Opportunities";

  const logoSrc =
    locale === "ar"
      ? "/logo.ar.png"
      : "/logo.en.png";

  // ✅ FIX: منع خلط اللغات أو fallback غير صحيح
  function getNavLabel(key: string) {
    const value = nav?.[key as keyof typeof nav];
  
    if (typeof value !== "string") return "";
  
    return value;
  }

  function getNavHref(key: string, href: string) {
    if (key === "opportunities") {
      return `/${locale}/opportunities`;
    }
    return href;
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || "");
    };
    getUser();
  }, []);

  const { notifications } = useNotifications(userId);

  return (
    <header
  className={`fixed top-0 left-0 right-0 z-[100] border-b border-white/[0.06] bg-black/90 backdrop-blur-xl transition-all duration-500 ${
    scrolled || menuOpen ? "shadow-[0_10px_40px_rgba(0,0,0,0.35)]" : ""
  }`}
>
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">

        {/* LOGO */}
        <Link
          href={`/${locale}`}
          onClick={closeMenu}
          className="group flex flex-col leading-none"
        >
          <div className="w-[140px] h-[40px] relative">
            <Image
              src={logoSrc}
              alt="MLAMH"
              fill
              className="object-contain"
              priority
            />
          </div>

          <span className="mt-1 text-[9px] uppercase tracking-[0.45em] text-gray-muted">
            {nav.tagline}
          </span>
        </Link>

        {/* NAV LINKS */}
        <ul className="hidden items-center gap-10 lg:flex">
          {navHrefs.map((link) => (
            <li key={link.key}>
              {link.key === "opportunities" ? (
                <Link
                  href={getNavHref(link.key, link.href)}
                  className="text-[11px] uppercase tracking-[0.25em] text-white/70 hover:text-gold"
                >
                  {getNavLabel(link.key)}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.25em] text-white/70 hover:text-gold"
                >
                  {getNavLabel(link.key)}
                </a>
              )}
            </li>
          ))}
        </ul>

        {/* RIGHT */}
        <div className="hidden items-center gap-6 lg:flex">
          <LanguageSwitcher
            locale={locale}
            label={nav.switchTo}
            targetLocale={targetLocale}
          />

          <div className="relative">
            <span className="text-xl cursor-pointer">🔔</span>

            {notifications.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>

          <Link
            href={`/${locale}/talent-login`}
            className="btn-luxury border border-gold/40 px-6 py-2.5 text-[10px] uppercase text-gold"
          >
            {talentJoinLabel}
          </Link>

          <Link
            href={`/${locale}/publisher-login`}
            className="text-[11px] uppercase text-white/60 hover:text-gold"
          >
            {publisherJoinLabel}
          </Link>
        </div>

        {/* MOBILE */}
        <div className="flex items-center gap-4 lg:hidden">
          <LanguageSwitcher
            locale={locale}
            label={nav.switchTo}
            targetLocale={targetLocale}
          />

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 flex-col justify-center gap-1.5"
          >
            <span className={`h-px w-6 bg-white ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`h-px w-6 bg-white ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`h-px w-6 bg-white ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="fixed inset-x-0 top-20 z-[90] bg-black/95 px-6 py-6">
          <div className="flex flex-col gap-5 text-right">
            {navHrefs.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={closeMenu}
                className="border-b border-white/10 pb-3 text-white/80 hover:text-gold"
              >
                {getNavLabel(link.key)}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}