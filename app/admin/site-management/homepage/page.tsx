import { HomepageHeroCard } from "@/components/admin/site-management/HomepageHeroCard";
import { HomepageHeroCardsCard } from "@/components/admin/site-management/HomepageHeroCardsCard";
import { HomepageStatsCard } from "@/components/admin/site-management/HomepageStatsCard";
import { ValuePropsCard } from "@/components/admin/site-management/ValuePropsCard";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { HomepageService } from "@/lib/services/HomepageService";
import { ValuePropsService } from "@/lib/services/ValuePropsService";

export default async function HomepageManagementPage() {
  await requireAdminAccess();

  const [
    heroResult,
    heroCardsResult,
    valuePropsResult,
  ] = await Promise.all([
    HomepageService.getHeroForAdmin(),
    HomepageService.getHeroCardsForAdmin(),
    ValuePropsService.getAllForAdmin(),
  ]);

  if (heroResult.error || !heroResult.data) {
    throw new Error(
      heroResult.error?.message ??
        "Unable to load homepage hero.",
    );
  }

  if (
    heroCardsResult.error ||
    !heroCardsResult.data
  ) {
    throw new Error(
      heroCardsResult.error?.message ??
        "Unable to load homepage hero cards.",
    );
  }

  if (
    valuePropsResult.error ||
    !valuePropsResult.data
  ) {
    throw new Error(
      valuePropsResult.error?.message ??
        "Unable to load homepage value props.",
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-4xl font-light text-white"
          style={{
            fontFamily: "var(--font-cormorant)",
          }}
        >
          Homepage Management
        </h1>

        <p className="mt-3 text-gray-400">
          Manage the content displayed on the public homepage.
        </p>
      </div>

      <HomepageHeroCard hero={heroResult.data} />

      <HomepageHeroCardsCard
        cards={heroCardsResult.data}
      />

      <HomepageStatsCard hero={heroResult.data} />

      <ValuePropsCard
        items={valuePropsResult.data}
      />
    </div>
  );
}