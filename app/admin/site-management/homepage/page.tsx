import { HomepageHeroCard } from "@/components/admin/site-management/HomepageHeroCard";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { HomepageHeroCardsCard } from "@/components/admin/site-management/HomepageHeroCardsCard";
import { HomepageStatsCard } from "@/components/admin/site-management/HomepageStatsCard";
import { ValuePropsCard } from "@/components/admin/site-management/ValuePropsCard";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { HomepageService } from "@/lib/services/HomepageService";
import { ValuePropsService } from "@/lib/services/ValuePropsService";

export default async function HomepageManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdminAccess();
  const query = await searchParams;
  const language = getAdminLanguage(query.lang);
  const isArabic = language === "ar";

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
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
        <AdminPageHeader
          eyebrow={isArabic ? "إدارة الموقع" : "SITE MANAGEMENT"}
          title={isArabic ? "الصفحة الرئيسية" : "Homepage"}
          description={
            isArabic
              ? "إدارة محتوى الصفحة الرئيسية والعناوين والبطاقات والقيم الظاهرة للزوار."
              : "Manage homepage content, headlines, cards, and public-facing value propositions."
          }
        />

        <div className="grid gap-6">
          <HomepageHeroCard hero={heroResult.data} />

          <HomepageHeroCardsCard
            cards={heroCardsResult.data}
          />

          <HomepageStatsCard hero={heroResult.data} />

          <ValuePropsCard
            items={valuePropsResult.data}
          />
        </div>
      </AdminPageContainer>
    </div>
  );
}