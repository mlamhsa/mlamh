"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  GalleryVerticalEnd,
  Sparkles,
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

  // Keep the dashboard home focused: only show sections that are not already
  // available in the desktop sidebar or mobile bottom navigation.
  const extraSections = [
    {
      href: `${dashboardHref}/profile/details`,
      label: isArabic ? "البيانات المهنية" : "Professional details",
      description: isArabic ? "المهارات والخبرة والقياسات" : "Skills, experience and measurements",
      icon: Sparkles,
    },
    {
      href: `${dashboardHref}/gallery`,
      label: isArabic ? "معرض الأعمال" : "Portfolio",
      description: isArabic ? "الصور والفيديو وأعمالك" : "Photos, video and your work",
      icon: GalleryVerticalEnd,
    },
    {
      href: `${dashboardHref}/subscriptions`,
      label: isArabic ? "الاشتراكات" : "Subscriptions",
      description: isArabic ? "الباقة والاشتراك" : "Plan and subscription",
      icon: WalletCards,
    },
  ];

  if (pathname === dashboardHref) {
    return (
      <>
        {mobileNavigation}
        <div dir={isArabic ? "rtl" : "ltr"} className="pb-24 xl:pb-0">
          <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6 lg:px-8 lg:pt-28">
            <div className="mb-5">
              <p className="text-xs font-semibold text-gold/80">
                {isArabic ? "وصول سريع" : "Quick access"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">
                {isArabic ? "أدوات إضافية" : "Additional tools"}
              </h2>
              <p className="mt-1 text-sm text-white/45">
                {isArabic
                  ? "الأقسام غير الموجودة في القائمة الجانبية أو الشريط السفلي."
                  : "Sections not already available in the sidebar or bottom navigation."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {extraSections.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-28 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4 text-start text-white/80 transition hover:border-gold/35 hover:bg-gold/[0.055] hover:text-gold active:scale-[0.98]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.045] text-gold">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-white/40">
                        {item.description}
                      </span>
                    </span>
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
