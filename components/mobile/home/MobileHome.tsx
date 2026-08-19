import { MobileFinalCTA } from "@/components/mobile/home/MobileFinalCTA";
import { MobileFooter } from "@/components/mobile/home/MobileFooter";
import { MobileHero } from "@/components/mobile/home/MobileHero";
import { MobileOpportunitiesSection } from "@/components/mobile/home/MobileOpportunitiesSection";
import { MobileOrganizationsSection } from "@/components/mobile/home/MobileOrganizationsSection";
import { MobileQuickAccess } from "@/components/mobile/home/MobileQuickAccess";
import { MobileTalentsSection } from "@/components/mobile/home/MobileTalentsSection";

import type { Locale } from "@/lib/i18n";
import type { Talent } from "@/lib/types/talent";

type MobileTalent = Talent & {
  image_url: string;
};

type MobileHomeProps = {
  locale: Locale;
  talents: MobileTalent[];
};

export function MobileHome({
  locale,
  talents,
}: MobileHomeProps) {
  return (
    <>
      <MobileHero locale={locale} />

      <MobileQuickAccess locale={locale} />

      <MobileTalentsSection
        locale={locale}
        talents={talents}
      />

      <MobileOpportunitiesSection locale={locale} />

      <MobileOrganizationsSection locale={locale} />

      <MobileFinalCTA locale={locale} />

      <MobileFooter locale={locale} />
    </>
  );
}