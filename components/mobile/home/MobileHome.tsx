import { HowItWorks } from "@/components/HowItWorks";
import { ValueProps } from "@/components/ValueProps";
import { MobileCastingBriefCTA } from "@/components/mobile/home/MobileCastingBriefCTA";
import { MobileFinalCTA } from "@/components/mobile/home/MobileFinalCTA";
import { MobileFooter } from "@/components/mobile/home/MobileFooter";
import { MobileHero } from "@/components/mobile/home/MobileHero";
import { MobileOpportunitiesSection } from "@/components/mobile/home/MobileOpportunitiesSection";
import { MobileOrganizationsSection } from "@/components/mobile/home/MobileOrganizationsSection";
import { MobileQuickAccess } from "@/components/mobile/home/MobileQuickAccess";
import { MobileTalentsSection } from "@/components/mobile/home/MobileTalentsSection";

import type { Locale } from "@/lib/i18n";
import type { PublicHomepageHero } from "@/lib/types/homepage";
import type { Talent } from "@/lib/types/talent";
import type { PublicHomepageValueProp } from "@/lib/types/value-props";

type MobileTalent = Talent & {
  image_url: string;
};

type MobileHomeProps = {
  locale: Locale;
  talents: MobileTalent[];
  hero: PublicHomepageHero;
  valueProps: PublicHomepageValueProp[];
};

export function MobileHome({
  locale,
  talents,
  hero,
  valueProps,
}: MobileHomeProps) {
  return (
    <>
      <MobileHero locale={locale} data={hero} />

      <MobileCastingBriefCTA locale={locale} />

      <MobileQuickAccess locale={locale} />

      <ValueProps locale={locale} data={valueProps} />

      <HowItWorks locale={locale} />

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
