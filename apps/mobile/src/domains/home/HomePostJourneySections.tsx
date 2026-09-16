import { HomeFinalCTASection } from "@/src/domains/home/HomeFinalCTASection";
import { HomeOrganizationsSection } from "@/src/domains/home/HomeOrganizationsSection";
import { HomeSceneSection } from "@/src/domains/home/HomeSceneSection";

type Props = {
  isArabic: boolean;
};

export function HomePostJourneySections({ isArabic }: Props) {
  return (
    <>
      <HomeOrganizationsSection isArabic={isArabic} />
      <HomeSceneSection isArabic={isArabic} />
      <HomeFinalCTASection isArabic={isArabic} />
    </>
  );
}
