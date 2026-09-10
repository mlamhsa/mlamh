"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import TalentSidebar from "@/components/talent/TalentSidebar";

type Props = {
  locale: string;
  children: ReactNode;
};

export default function TalentDashboardShell({ locale, children }: Props) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/talent-dashboard`;

  // The dashboard home already owns its richer sidebar because it supplies
  // live application/message/notification counts. Subpages use this shell so
  // navigation remains fixed while the content changes beside it.
  if (pathname === dashboardHref) {
    return <>{children}</>;
  }

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:pt-32 xl:py-10 xl:pt-32">
        <div className="flex flex-col gap-6 xl:flex-row">
          <aside className="hidden xl:block xl:w-80 xl:flex-shrink-0">
            <div className="sticky top-28">
              <TalentSidebar
                locale={locale}
                totalApplications={0}
                notificationCount={0}
                unreadMessagesCount={0}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
