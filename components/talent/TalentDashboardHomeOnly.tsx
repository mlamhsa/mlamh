"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  locale: "ar" | "en";
  children: ReactNode;
};

export default function TalentDashboardHomeOnly({ locale, children }: Props) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/talent-dashboard`;

  if (pathname !== dashboardHref) {
    return null;
  }

  return <>{children}</>;
}
