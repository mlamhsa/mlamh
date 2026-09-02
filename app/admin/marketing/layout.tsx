import { Suspense } from "react";

import { MarketingHubNav } from "@/components/admin/marketing/MarketingHubNav";
import { MarketingLiveRefresh } from "@/components/admin/marketing/MarketingLiveRefresh";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";

export default async function MarketingHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMarketingAdminAccess("marketing.view");

  return (
    <div className="min-w-0">
      <MarketingLiveRefresh intervalMs={5000} />
      <Suspense
        fallback={
          <div className="mx-6 mt-6 h-14 animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
        }
      >
        <div className="px-6 pt-6">
          <MarketingHubNav />
        </div>
      </Suspense>
      {children}
    </div>
  );
}
