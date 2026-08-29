import type { ReactNode } from "react";

import { PublisherFeaturedEntryPoint } from "@/components/payments/PublisherFeaturedEntryPoint";
import PublisherShell from "@/components/publisher/PublisherShell";

export default async function PublisherDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <PublisherShell
      locale={locale}
      isRtl={locale !== "en"}
    >
      {children}
      <PublisherFeaturedEntryPoint locale={locale} />
    </PublisherShell>
  );
}
