"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCallback } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  GalleryVerticalEnd,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function TalentSidebar({
  locale,
  totalApplications,
  notificationCount,
}: {
  locale: string;
  totalApplications: number;
  notificationCount: number;
}) {
  const pathname = usePathname();
const router = useRouter();
const isAr = locale === "ar";
const [loggingOut, setLoggingOut] = useState(false);

const isActive = (href: string) => pathname === href;

const handleLogout = useCallback(async () => {
  if (loggingOut) return;

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

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="border-b border-white/10 pb-6">
        <p className="text-3xl font-light text-gold">ملامح</p>
        <p className="arabic-safe mt-2 text-xs uppercase tracking-[0.3em] text-white/35">
          {isAr ? "مساحة الموهبة" : "Talent Workspace"}
        </p>
      </div>

      <nav className="mt-6 grid gap-2">
        <SidebarLink
          active={isActive(`/${locale}/talent-dashboard`)}
          icon={<LayoutDashboard size={17} />}
          href={`/${locale}/talent-dashboard`}
          label={isAr ? "الرئيسية" : "Home"}
        />

        <SidebarLink
          active={isActive(`/${locale}/talent-dashboard/profile`)}
          icon={<UserRound size={17} />}
          href={`/${locale}/talent-dashboard/profile`}
          label={isAr ? "الملف الشخصي" : "Profile"}
        />

        <SidebarLink
          active={isActive(`/${locale}/talent-dashboard/requests`)}
          icon={<BriefcaseBusiness size={17} />}
          href={`/${locale}/talent-dashboard/requests`}
          label={isAr ? "طلباتي" : "Applications"}
          badge={totalApplications > 0 ? totalApplications : undefined}
        />

        <SidebarLink
          active={isActive(`/${locale}/talent-dashboard/gallery`)}
          icon={<GalleryVerticalEnd size={17} />}
          href={`/${locale}/talent-dashboard/gallery`}
          label={isAr ? "معرض الأعمال" : "Portfolio"}
        />

        <SidebarLink
          active={isActive(`/${locale}/talent-dashboard/notifications`)}
          icon={<Bell size={17} />}
          href={`/${locale}/talent-dashboard/notifications`}
          label={isAr ? "الإشعارات" : "Notifications"}
          badge={notificationCount > 0 ? notificationCount : undefined}
        />

        <SidebarLink
          active={isActive(`/${locale}/talent-dashboard/settings`)}
          icon={<Settings size={17} />}
          href={`/${locale}/talent-dashboard/settings`}
          label={isAr ? "الإعدادات" : "Settings"}
        />

        <SidebarLink
          icon={<CalendarDays size={17} />}
          href={`/${locale}/opportunities`}
          label={isAr ? "استعراض الفرص" : "Browse Opportunities"}
        />
      </nav>

      <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
      <Link
  href={`/${locale === "ar" ? "en" : "ar"}/talent-dashboard`}
  aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
  className="block rounded-2xl border border-white/10 px-4 py-3 text-center text-xs uppercase tracking-[0.22em] text-white/50 transition hover:border-gold/40 hover:text-gold"
>
          {isAr ? "English" : "العربية"}
        </Link>

        <button
  type="button"
  onClick={handleLogout}
  disabled={loggingOut}
  aria-label={isAr ? "تسجيل الخروج" : "Sign out"}
  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/[0.04] px-4 py-3 text-sm text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
>
<LogOut size={16} />
{loggingOut
  ? isAr
    ? "جارٍ تسجيل الخروج..."
    : "Signing out..."
  : isAr
    ? "تسجيل الخروج"
    : "Sign Out"}
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
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-sm transition ${
        active
          ? "border-gold/40 bg-gold/[0.12] text-gold"
          : "border-transparent text-white/55 hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={active ? "text-gold" : "text-white/35"}>{icon}</span>
        <span>{label}</span>
      </span>

      {badge ? (
        <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] text-black">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}