"use client";

import { usePathname } from "next/navigation";

import { SceneDashboardEntryPoint } from "@/components/scene/SceneDashboardEntryPoint";

type Props = {
  locale: "ar" | "en";
};

export default function PublisherSceneEntryPoint({ locale }: Props) {
  const pathname = usePathname();
  const dashboardHref = `/${locale}/publisher-dashboard`;

  if (pathname !== dashboardHref) {
    return null;
  }

  return <SceneDashboardEntryPoint locale={locale} audience="publisher" />;
}
