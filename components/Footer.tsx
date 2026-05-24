"use client";

import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

const navHrefs = [
  { key: "talents" as const, href: "#talents" },
  { key: "agencies" as const, href: "#agencies" },
  { key: "about" as const, href: "#about" },
  { key: "contact" as const, href: "#contact" },
];

export function Footer({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const { nav, footer: f } = dict;
  const isRtl = locale === "ar";
  const bodyFont = isRtl
    ? "var(--font-noto-arabic)"
    : "var(--font-dm-sans)";

  return (
    <footer
      id="contact"
      className="relative border-t border-white/[0.06] bg-gray-deep pt-20 pb-10"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-12">
          <div className={`lg:col-span-5 ${isRtl ? "text-right" : "text-left"}`}>
            <Link href={`/${locale}`} className="inline-block">
              <span
                className="text-4xl font-light tracking-[0.3em] text-white"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                MLAMH
              </span>
            </Link>
            <p
              className="mt-4 max-w-sm text-sm leading-relaxed text-gray-muted"
              style={{ fontFamily: bodyFont }}
            >
              {f.description}
            </p>
            <p
              className="mt-4 text-sm text-white/40"
              style={{ fontFamily: bodyFont }}
            >
              {f.tagline}
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4">
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold">
                {f.navigate}
              </p>
              <ul className="space-y-3">
                {navHrefs.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-gold"
                    >
                      {nav[link.key]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold">
                {f.contact}
              </p>
              <ul
                className="space-y-3 text-sm text-white/60"
                style={{ fontFamily: bodyFont }}
              >
                <li>
                  <a
                    href="mailto:hello@mlamh.com"
                    className="transition-colors hover:text-gold"
                  >
                    hello@mlamh.com
                  </a>
                </li>
                <li>{f.location}</li>
                <li>{f.phone}</li>
              </ul>
            </div>
          </div>

          <div className={`lg:col-span-3 ${isRtl ? "text-right" : "text-left"}`}>
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gold">
              {f.newsletter}
            </p>
            <p
              className="mb-4 text-sm text-gray-muted"
              style={{ fontFamily: bodyFont }}
            >
              {f.newsletterBody}
            </p>
            <form
              className={`flex border border-white/10 ${isRtl ? "flex-row-reverse" : ""}`}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder={f.emailPlaceholder}
                aria-label={f.emailAria}
                dir={isRtl ? "rtl" : "ltr"}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-gold/40"
              />
              <button
                type="submit"
                className={`btn-luxury px-5 text-gold transition-colors hover:bg-gold/10 ${
                  isRtl
                    ? "border-r border-white/10"
                    : "border-l border-white/10"
                }`}
                aria-label={f.subscribeAria}
              >
                {isRtl ? "←" : "→"}
              </button>
            </form>
          </div>
        </div>

        <div className="gold-line my-16" />

        <div
          className={`flex flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-[0.25em] text-gray-muted sm:flex-row ${
            isRtl ? "sm:flex-row-reverse" : ""
          }`}
        >
          <p>
            © {new Date().getFullYear()} MLAMH. {f.rights}
          </p>
          <div className="flex gap-8">
            <a href="#" className="transition-colors hover:text-gold">
              {f.privacy}
            </a>
            <a href="#" className="transition-colors hover:text-gold">
              {f.terms}
            </a>
            <a href="#" className="transition-colors hover:text-gold">
              {f.instagram}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
