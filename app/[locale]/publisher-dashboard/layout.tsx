import type { ReactNode } from "react";

import { PublisherFeaturedEntryPoint } from "@/components/payments/PublisherFeaturedEntryPoint";
import PublisherOpportunityRealtime from "@/components/publisher/PublisherOpportunityRealtime";
import PublisherShell from "@/components/publisher/PublisherShell";
import { SceneDashboardEntryPoint } from "@/components/scene/SceneDashboardEntryPoint";
import { requirePublisher } from "@/lib/auth/require-publisher";

export default async function PublisherDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { publisher } = await requirePublisher(locale);
  const safeLocale = locale === "en" ? "en" : "ar";

  return (
    <PublisherShell
      locale={locale}
      isRtl={locale !== "en"}
    >
      <PublisherOpportunityRealtime publisherId={publisher.id} />
      <PublisherFeaturedEntryPoint locale={locale} />
      <SceneDashboardEntryPoint locale={safeLocale} audience="publisher" />
      {children}
    </PublisherShell>
  );
}
