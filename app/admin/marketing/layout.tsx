import { Suspense } from "react";

import { MarketingHubNav } from "@/components/admin/marketing/MarketingHubNav";
import { requireAdminAccess } from "@/lib/auth/require-admin";

export default async function MarketingHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminAccess();

  return (
    <div className="min-w-0">
      <Suspense
        fallback={
          <div className="mx-6 mt-6 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
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
