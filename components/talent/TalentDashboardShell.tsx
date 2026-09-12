"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

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

  if (pathname === dashboardHref) {
    return (
      <>
        {mobileNavigation}
        <div className="pb-24 xl:pb-0">{children}</div>
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
