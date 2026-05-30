"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Dictionary, Locale } from "@/lib/i18n";

const navHrefs = [
  { key: "talents" as const, href: "#talents" },
  { key: "agencies" as const, href: "#agencies" },
  { key: "about" as const, href: "#about" },
  { key: "contact" as const, href: "#contact" },
];

export function Navbar({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { nav } = dict;
  const targetLocale = locale === "ar" ? "en" : "ar";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const talentLoginLabel =
    locale === "ar" ? "دخول الموهبة" : "Talent Login";

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
          <span
            className="text-2xl font-light tracking-[0.35em] text-white transition-colors group-hover:text-gold md:text-3xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            MLAMH
          </span>

          <span className="mt-1 text-[9px] uppercase tracking-[0.45em] text-gray-muted">
            {nav.tagline}
          </span>
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {navHrefs.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[11px] uppercase tracking-[0.25em] text-white/70 transition-colors duration-300 hover:text-gold"
              >
                {nav[link.key]}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 md:flex">
          <LanguageSwitcher
            locale={locale}
            label={nav.switchTo}
            targetLocale={targetLocale}
          />

          <a
            href="#agencies"
            className="text-[11px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
          >
            {nav.forClients}
          </a>

          <Link
            href="/talent-login"
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

      <div
        className={`fixed inset-0 z-40 flex flex-col bg-black/95 backdrop-blur-2xl transition-all duration-500 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex flex-1 flex-col justify-center gap-8 px-10 pt-20">
          {navHrefs.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-4xl font-light tracking-wide text-white transition-colors hover:text-gold"
              style={{
                fontFamily: "var(--font-cormorant)",
                animationDelay: `${i * 80}ms`,
              }}
            >
              {nav[link.key]}
            </a>
          ))}

          <div className="gold-line my-4 w-24" />

          <Link
            href="/talent-login"
            onClick={() => setMenuOpen(false)}
            className="inline-flex w-fit text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:text-gold"
          >
            {talentLoginLabel}
          </Link>

          <Link
            href={`/${locale}/join`}
            onClick={() => setMenuOpen(false)}
            className="btn-luxury inline-flex w-fit border border-gold/40 px-8 py-3 text-[10px] uppercase tracking-[0.3em] text-gold"
          >
            {nav.joinPlatform}
          </Link>
        </div>

        <p
          className="pb-12 text-center text-sm text-gray-muted"
          style={{
            fontFamily:
              locale === "ar"
                ? "var(--font-noto-arabic)"
                : "var(--font-dm-sans)",
          }}
        >
          {nav.mobileTagline}
        </p>
      </div>
    </header>
  );
}