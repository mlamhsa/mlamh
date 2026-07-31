import type { ReactNode } from "react";
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
    </PublisherShell>
  );
}