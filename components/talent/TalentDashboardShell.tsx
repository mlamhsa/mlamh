"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  GalleryVerticalEnd,
  MessageSquareText,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import TalentMobileBottomNav from "@/components/talent/TalentMobileBottomNav";
import TalentSidebar from "@/components/talent/TalentSidebar";

type Props = {
  locale: string;
  children: ReactNode;
  totalApplications?: number;
  notificationCount?: number;
  unreadMessagesCount?: number;
};

export default function TalentDashboardShell({
  locale,
  children,
  totalApplications = 0,
  notificationCount = 0,
  unreadMessagesCount = 0,
}: Props) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/talent-dashboard`;
  const isArabic = locale === "ar";

  const sidebar = (
    <TalentSidebar
      locale={locale}
      totalApplications={totalApplications}
      notificationCount={notificationCount}
      unreadMessagesCount={unreadMessagesCount}
    />
  );

  const mobileNavigation = (
    <TalentMobileBottomNav
      locale={locale}
      totalApplications={totalApplications}
      unreadMessagesCount={unreadMessagesCount}
    />
  );

  const homeSections = [
    {
      href: `${dashboardHref}/profile`,
      label: isArabic ? "الملف الشخصي" : "Profile",
      icon: UserRound,
    },
    {
      href: `${dashboardHref}/profile/details`,
      label: isArabic ? "البيانات المهنية" : "Professional details",
      icon: Sparkles,
    },
    {
      href: `${dashboardHref}/gallery`,
      label: isArabic ? "معرض الأعمال" : "Portfolio",
      icon: GalleryVerticalEnd,
    },
    {
      href: `/${locale}/opportunities`,
      label: isArabic ? "الفرص" : "Opportunities",
      icon: CalendarDays,
    },
    {
      href: `${dashboardHref}/applications`,
      label: isArabic ? "طلباتي" : "Applications",
      icon: BriefcaseBusiness,
      badge: totalApplications,
    },
    {
      href: `${dashboardHref}/messages`,
      label: isArabic ? "الرسائل" : "Messages",
      icon: MessageSquareText,
      badge: unreadMessagesCount,
    },
    {
      href: `${dashboardHref}/notifications`,
      label: isArabic ? "الإشعارات" : "Notifications",
      icon: Bell,
      badge: notificationCount,
    },
    {
      href: `${dashboardHref}/subscriptions`,
      label: isArabic ? "الاشتراكات" : "Subscriptions",
      icon: WalletCards,
    },
    {
      href: `${dashboardHref}/settings`,
      label: isArabic ? "الإعدادات" : "Settings",
      icon: Settings,
    },
    {
      href: `/${locale}/talents`,
      label: isArabic ? "المواهب" : "Talents",
      icon: UsersRound,
    },
    {
      href: `/${locale}/publishers`,
      label: isArabic ? "الشركات" : "Companies",
      icon: Building2,
    },
  ];

  if (pathname === dashboardHref) {
    return (
      <>
        {mobileNavigation}
        <div dir={isArabic ? "rtl" : "ltr"} className="pb-24 xl:pb-0">
          <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6 lg:px-8 lg:pt-28">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gold/80">
                  {isArabic ? "وصول سريع" : "Quick access"}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                  {isArabic ? "جميع أقسام لوحة الموهبة" : "All talent dashboard sections"}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {homeSections.map((item) => {
                const Icon = item.icon;
                const badge = "badge" in item ? item.badge : undefined;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-4 text-center text-sm text-white/80 transition hover:border-gold/35 hover:bg-gold/[0.055] hover:text-gold active:scale-[0.98]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.045] text-gold">
                      <Icon size={21} aria-hidden="true" />
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {typeof badge === "number" && badge > 0 ? (
                      <span className="absolute end-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[9px] font-semibold text-black">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>

          {children}
        </div>
      </>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      {mobileNavigation}
      <div className="w-full px-4 pb-28 pt-28 sm:px-6 lg:pt-32 xl:px-8 xl:py-10 xl:pt-32 2xl:px-10">
        <div className="flex w-full flex-col gap-6 xl:flex-row">
          <aside className="hidden xl:block xl:w-80 xl:flex-shrink-0">
            <div className="sticky top-28">{sidebar}</div>
          </aside>

          <div className="min-w-0 flex-1 [&>main]:!min-h-0 [&>main]:!bg-transparent [&>main]:!px-0 [&>main]:!pb-0 [&>main]:!pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
