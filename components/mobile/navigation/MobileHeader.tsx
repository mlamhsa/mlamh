"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, Menu, X } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { MobileIconButton } from "@/components/mobile/ui";

type MobileHeaderProps = {
  locale: Locale;
  isLoggedIn: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
};

export function MobileHeader({
  locale,
  isLoggedIn,
  menuOpen,
  onMenuToggle,
}: MobileHeaderProps) {
  const isArabic = locale === "ar";

  const accountHref = isLoggedIn
    ? `/${locale}/dashboard-router`
    : `/${locale}/login`;

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="grid h-full w-full grid-cols-[3rem_1fr_3rem] items-center gap-3 lg:hidden"
    >
      <MobileIconButton
        label={
          menuOpen
            ? isArabic
              ? "إغلاق القائمة"
              : "Close menu"
            : isArabic
              ? "فتح القائمة"
              : "Open menu"
        }
        icon={
          menuOpen ? (
            <X size={22} strokeWidth={1.8} />
          ) : (
            <Menu size={22} strokeWidth={1.8} />
          )
        }
        variant={menuOpen ? "gold" : "ghost"}
        size="small"
        active={menuOpen}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
      />

      <Link
        href={`/${locale}`}
        aria-label={isArabic ? "الصفحة الرئيسية" : "Home"}
        className="flex min-w-0 items-center justify-center"
      >
        <Image
          src={isArabic ? "/logo.ar.png" : "/logo.en.png"}
          alt="MLAMH"
          width={220}
          height={90}
          priority
          className="h-auto w-32 object-contain"
        />
      </Link>

      <Link
        href={accountHref}
        aria-label={
          isLoggedIn
            ? isArabic
              ? "حسابي"
              : "My account"
            : isArabic
              ? "تسجيل الدخول"
              : "Login"
        }
        className="inline-flex h-11 w-11 items-center justify-center justify-self-end rounded-xl border border-transparent text-white/65 transition active:scale-95 hover:bg-white/[0.05] hover:text-white"
      >
        <LayoutDashboard size={21} strokeWidth={1.8} />
      </Link>
    </div>
  );
}