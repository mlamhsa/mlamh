import type { ReactNode } from "react";

import { PublisherFeaturedEntryPoint } from "@/components/payments/PublisherFeaturedEntryPoint";
import PublisherOpportunityRealtime from "@/components/publisher/PublisherOpportunityRealtime";
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

  return (
    <PublisherShell
      locale={locale}
      isRtl={locale !== "en"}
    >
      <PublisherOpportunityRealtime publisherId={publisher.id} />
      <PublisherFeaturedEntryPoint locale={locale} />
      {children}
    </PublisherShell>
  );
}
