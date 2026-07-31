"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  GalleryVerticalEnd,
  Languages,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type TalentSidebarProps = {
  locale: string;
  totalApplications: number;
  notificationCount: number;
};

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  active?: boolean;
};

export default function TalentSidebar({
  locale,
  totalApplications,
  notificationCount,
}: TalentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isAr = locale === "ar";
  const [loggingOut, setLoggingOut] = useState(false);

  const dashboardHref = `/${locale}/talent-dashboard`;
  const switchedLocale = isAr ? "en" : "ar";

  /*
   * الرئيسية تتطابق مع المسار نفسه فقط.
   * بقية الروابط تظل نشطة داخل الصفحات الفرعية التابعة لها.
   */
  const isActive = useCallback(
    (href: string, exact = false) => {
      if (exact) {
        return pathname === href;
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const handleLogout = useCallback(async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[TalentSidebar.logout]", error);
      setLoggingOut(false);
      return;
    }

    router.replace(`/${locale}/login`);
    router.refresh();
  }, [locale, loggingOut, router]);

  const items = [
    {
      href: dashboardHref,
      label: isAr ? "الرئيسية" : "Home",
      icon: <LayoutDashboard size={18} aria-hidden="true" />,
      exact: true,
      badge: undefined,
    },
    {
      href: `${dashboardHref}/profile`,
      label: isAr ? "الملف الشخصي" : "Profile",
      icon: <UserRound size={18} aria-hidden="true" />,
      exact: false,
      badge: undefined,
    },
    {
      href: `${dashboardHref}/requests`,
      label: isAr ? "طلباتي" : "Applications",
      icon: <BriefcaseBusiness size={18} aria-hidden="true" />,
      exact: false,
      badge:
        totalApplications > 0
          ? totalApplications
          : undefined,
    },
    {
      href: `${dashboardHref}/gallery`,
      label: isAr ? "معرض الأعمال" : "Portfolio",
      icon: <GalleryVerticalEnd size={18} aria-hidden="true" />,
      exact: false,
      badge: undefined,
    },
    {
      href: `${dashboardHref}/notifications`,
      label: isAr ? "الإشعارات" : "Notifications",
      icon: <Bell size={18} aria-hidden="true" />,
      exact: false,
      badge:
        notificationCount > 0
          ? notificationCount
          : undefined,
    },
    {
      href: `${dashboardHref}/settings`,
      label: isAr ? "الإعدادات" : "Settings",
      icon: <Settings size={18} aria-hidden="true" />,
      exact: false,
      badge: undefined,
    },
  ];

  return (
    <aside className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/80 p-5 backdrop-blur-xl sm:p-6">
      <Link
  href={dashboardHref}
  className="block border-b border-white/10 pb-5"
>
  <p className="arabic-safe text-xs uppercase tracking-[0.28em] text-white/35">
    {isAr ? "مساحة الموهبة" : "Talent Workspace"}
  </p>
</Link>

      <nav
  className="mt-6 flex w-full flex-col gap-2"
  aria-label={
    isAr ? "تنقل الموهبة" : "Talent navigation"
  }
>
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.badge}
            active={isActive(item.href, item.exact)}
          />
        ))}
      </nav>

      <div className="mt-6 grid w-full gap-3 border-t border-white/10 pt-6">
        <Link
          href={`/${locale}/opportunities`}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-gold bg-gold/10 px-5 py-4 text-center text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <CalendarDays size={17} aria-hidden="true" />

          <span>
            {isAr
              ? "استعراض الفرص"
              : "Browse Opportunities"}
          </span>
        </Link>

        <Link
          href={`/${switchedLocale}/talent-dashboard`}
          aria-label={
            isAr
              ? "Switch to English"
              : "التبديل إلى العربية"
          }
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-center text-sm text-white/55 transition hover:border-gold/40 hover:bg-gold/5 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <Languages size={17} aria-hidden="true" />

          <span>{isAr ? "English" : "العربية"}</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={
            isAr ? "تسجيل الخروج" : "Sign out"
          }
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300 transition hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut size={17} aria-hidden="true" />

          <span>
            {loggingOut
              ? isAr
                ? "جارٍ تسجيل الخروج..."
                : "Signing out..."
              : isAr
                ? "تسجيل الخروج"
                : "Sign Out"}
          </span>
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  badge,
  active = false,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-14 w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        active
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-white/10 text-white/60 hover:bg-white/[0.03] hover:text-white"
      }`}
    >
      <span
        className={`shrink-0 ${
          active ? "text-gold" : "text-white/35"
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1 text-sm leading-5">
  {label}
</span>

      {badge !== undefined && badge > 0 ? (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-semibold leading-none text-black">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}