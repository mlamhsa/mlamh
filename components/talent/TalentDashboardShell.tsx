"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dashboardHref = `/${locale}/talent-dashboard`;
  const isArabic = locale === "ar";

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  const sidebar = (
    <TalentSidebar
      locale={locale}
      totalApplications={totalApplications}
      notificationCount={notificationCount}
      unreadMessagesCount={unreadMessagesCount}
    />
  );

  const mobileNavigation = (
    <>
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        className="fixed top-24 z-40 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/88 text-white/70 shadow-xl backdrop-blur-xl transition hover:border-gold/35 hover:text-gold xl:hidden"
        style={isArabic ? { right: 16 } : { left: 16 }}
        aria-label={isArabic ? "فتح المزيد من خيارات لوحة الموهبة" : "Open more talent dashboard options"}
        aria-expanded={mobileNavOpen}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[90] xl:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
          />
          <div
            className={`absolute inset-y-0 w-[min(88vw,360px)] overflow-y-auto border-white/10 bg-black p-4 pb-28 shadow-2xl ${
              isArabic ? "right-0 border-l" : "left-0 border-r"
            }`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-gold/35 hover:text-gold"
                aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}

      <TalentMobileBottomNav
        locale={locale}
        totalApplications={totalApplications}
        unreadMessagesCount={unreadMessagesCount}
      />
    </>
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

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
