"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDictionary, type Locale } from "@/lib/i18n";

import { useNotifications } from "@/hooks/useNotifications";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const talentLoginLabel =
    locale === "ar" ? "دخول الموهبة" : "Talent Login";

  const opportunitiesLabel =
    locale === "ar" ? "الفرص" : "Opportunities";

  function getNavLabel(key: string) {
    if (key === "opportunities") {
      return opportunitiesLabel;
    }

    return nav[key as keyof typeof nav];
  }

  function getNavHref(key: string, href: string) {
    if (key === "opportunities") {
      return `/${locale}/opportunities`;
    }

    return href;
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href={`/${locale}`} className="group flex flex-col leading-none">
          <span className="text-2xl font-light tracking-[0.35em] text-white transition-colors group-hover:text-gold md:text-3xl">
            MLAMH
          </span>

          <span className="mt-1 text-[9px] uppercase tracking-[0.45em] text-gray-muted">
            {nav.tagline}
          </span>
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {navHrefs.map((link) => (
            <li key={link.key}>
              {link.key === "opportunities" ? (
                <Link
                  href={getNavHref(link.key, link.href)}
                  className="text-[11px] uppercase tracking-[0.25em] text-white/70 transition-colors duration-300 hover:text-gold"
                >
                  {getNavLabel(link.key)}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.25em] text-white/70 transition-colors duration-300 hover:text-gold"
                >
                  {getNavLabel(link.key)}
                </a>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 md:flex">
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

            {notifications.length > 0 && (
              <div className="absolute right-0 mt-2 w-64 bg-black border border-white/10 rounded-lg shadow-lg">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className="p-2 text-sm text-white/80 border-b border-white/10"
                  >
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href={`/${locale}/talent-login`}
            className="text-[11px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-gold"
          >
            {talentLoginLabel}
          </Link>

          <Link
            href={`/${locale}/join`}
            className="btn-luxury border border-gold/40 px-6 py-2.5 text-[10px] uppercase tracking-[0.3em] text-gold transition-colors hover:border-gold hover:bg-gold/10"
          >
            {nav.joinAsTalent}
          </Link>
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher
            locale={locale}
            label={nav.switchTo}
            targetLocale={targetLocale}
          />

          <button
            type="button"
            aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5"
          >
            <span
              className={`block h-px w-6 bg-white transition-all duration-300 ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />

            <span
              className={`block h-px w-6 bg-white transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />

            <span
              className={`block h-px w-6 bg-white transition-all duration-300 ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>
    </header>
  );
}