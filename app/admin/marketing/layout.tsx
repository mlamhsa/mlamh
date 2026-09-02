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
  const schedulerConfigured = Boolean(process.env.CRON_SECRET?.trim());

  return (
    <div className="min-w-0">
      <MarketingLiveRefresh intervalMs={5000} />
      {!schedulerConfigured ? (
        <div className="mx-6 mt-5 flex items-center justify-between gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.045] px-4 py-3 text-xs text-amber-100/75">
          <div>
            <span className="font-medium text-amber-100">Autonomous scheduler · Setup required</span>
            <span className="ms-2 text-amber-100/45">AI tools remain available, but scheduled cycles will stay safely locked until server-side cron authentication is configured.</span>
          </div>
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-300" />
        </div>
      ) : null}
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
