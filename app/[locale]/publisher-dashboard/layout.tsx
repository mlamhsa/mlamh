import type { ReactNode } from "react";

import { PublisherFeaturedEntryPoint } from "@/components/payments/PublisherFeaturedEntryPoint";
import PublisherOpportunityRealtime from "@/components/publisher/PublisherOpportunityRealtime";
import PublisherSceneEntryPoint from "@/components/publisher/PublisherSceneEntryPoint";
import PublisherShell from "@/components/publisher/PublisherShell";
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
      <PublisherSceneEntryPoint locale={safeLocale} />
      {children}
    </PublisherShell>
  );
}
