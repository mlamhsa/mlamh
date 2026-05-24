"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";

export function LanguageSwitcher({
  locale,
  label,
  targetLocale,
}: {
  locale: Locale;
  label: Dictionary["nav"]["switchTo"];
  targetLocale: Locale;
}) {
  const pathname = usePathname();
  const href = pathname.replace(`/${locale}`, `/${targetLocale}`) || `/${targetLocale}`;

  return (
    <Link
      href={href}
      className="text-[10px] uppercase tracking-[0.25em] text-white/50 transition-colors duration-300 hover:text-gold"
      hrefLang={targetLocale}
    >
      {label}
    </Link>
  );
}
