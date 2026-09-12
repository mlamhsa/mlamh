"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Info,
  Languages,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type TalentSidebarProps = {
  locale: string;
  totalApplications: number;
  notificationCount: number;
  unreadMessagesCount: number;
};

type SidebarLinkProps = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  active?: boolean;
};

type NavItem = SidebarLinkProps & {
  exact?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export default function TalentSidebar({
  locale,
  totalApplications,
  notificationCount,
  unreadMessagesCount,
}: TalentSidebarProps) {
  const pathname = usePathname();
  const isAr = locale === "ar";
  const [loggingOut, setLoggingOut] = useState(false);
  const dashboardHref = `/${locale}/talent-dashboard`;
  const switchedLocale = isAr ? "en" : "ar";

  const isActive = useCallback(
    (href: string, exact = false) => {
      if (exact) return pathname === href;
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[TalentSidebar.logout]", error);
      setLoggingOut(false);
      return;
    }
    window.location.replace(`/${locale}/login`);
  }, [locale, loggingOut]);

  const groups: NavGroup[] = [
    {
      label: isAr ? "حسابي" : "My account",
      items: [
        {
          href: `${dashboardHref}/profile`,
          label: isAr ? "الملف الشخصي" : "Profile",
          icon: <UserRound size={19} aria-hidden="true" />,
        },
        {
          href: `${dashboardHref}/settings`,
          label: isAr ? "الإعدادات" : "Settings",
          icon: <Settings size={19} aria-hidden="true" />,
        },
      ],
    },
    {
      label: isAr ? "اكتشف" : "Discover",
      items: [
        {
          href: `/${locale}/talents`,
          label: isAr ? "المواهب" : "Talents",
          icon: <UsersRound size={19} aria-hidden="true" />,
        },
        {
          href: `/${locale}/opportunities`,
          label: isAr ? "الفرص" : "Opportunities",
          icon: <CalendarDays size={19} aria-hidden="true" />,
        },
        {
          href: `/${locale}/publishers`,
          label: isAr ? "الشركات" : "Companies",
          icon: <Building2 size={19} aria-hidden="true" />,
        },
      ],
    },
    {
      label: isAr ? "نشاطي" : "Activity",
      items: [
        {
          href: `${dashboardHref}/applications`,
          label: isAr ? "طلباتي" : "Applications",
          icon: <BriefcaseBusiness size={19} aria-hidden="true" />,
          badge: totalApplications > 0 ? totalApplications : undefined,
        },
        {
          href: `${dashboardHref}/messages`,
          label: isAr ? "الرسائل" : "Messages",
          icon: <MessageSquareText size={19} aria-hidden="true" />,
          badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        },
        {
          href: `${dashboardHref}/notifications`,
          label: isAr ? "الإشعارات" : "Notifications",
          icon: <Bell size={19} aria-hidden="true" />,
          badge: notificationCount > 0 ? notificationCount : undefined,
        },
      ],
    },
    {
      label: isAr ? "الدعم" : "Support",
      items: [
        {
          href: `/${locale}/about`,
          label: isAr ? "عن ملامح" : "About MLAMH",
          icon: <Info size={19} aria-hidden="true" />,
        },
      ],
    },
  ];

  return (
    <aside className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-black/88 p-5 backdrop-blur-xl sm:p-6">
      <div className="border-b border-white/10 pb-5">
        <p className="arabic-safe text-xs uppercase tracking-[0.26em] text-white/35">
          {isAr ? "لوحة الموهبة" : "Talent dashboard"}
        </p>
        <Link
          href={dashboardHref}
          aria-current={isActive(dashboardHref, true) ? "page" : undefined}
          className={`mt-4 flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
            isActive(dashboardHref, true)
              ? "border-gold/45 bg-gold text-black"
              : "border-gold/25 bg-gold/[0.055] text-gold hover:bg-gold/10"
          }`}
        >
          <span className="flex items-center gap-3 text-sm font-semibold">
            <LayoutDashboard size={19} aria-hidden="true" />
            {isAr ? "لوحة الموهبة" : "Talent dashboard"}
          </span>
          <span className="text-xs opacity-60">↗</span>
        </Link>
      </div>

      <nav className="mt-6 space-y-6" aria-label={isAr ? "تنقل الموهبة" : "Talent navigation"}>
        {groups.map((group) => (
          <section key={group.label}>
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/30">
              {group.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  active={isActive(item.href, item.exact)}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <div className="mt-7 grid w-full gap-2 border-t border-white/10 pt-5">
        <Link
          href={`/${switchedLocale}/talent-dashboard`}
          aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm text-white/45 transition hover:bg-white/[0.035] hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <Languages size={18} aria-hidden="true" />
          <span>{isAr ? "English" : "العربية"}</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={isAr ? "تسجيل الخروج" : "Sign out"}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.025] px-3 text-sm text-red-300 transition hover:bg-red-500/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>
            {loggingOut
              ? isAr ? "جارٍ تسجيل الخروج..." : "Signing out..."
              : isAr ? "تسجيل الخروج" : "Sign out"}
          </span>
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ href, label, icon, badge, active = false }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        active
          ? "bg-gold/[0.09] text-gold"
          : "text-white/60 hover:bg-white/[0.035] hover:text-white"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-gold/[0.12] text-gold" : "bg-white/[0.035] text-white/35"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-5">{label}</span>
      {badge !== undefined && badge > 0 ? (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-semibold leading-none text-black">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
