import { useLocalSearchParams } from "expo-router";

import { SectionPlaceholder } from "@/src/components/SectionPlaceholder";

export default function SceneCategoryRoute() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const category = typeof slug === "string" ? slug : "scene";

  return (
    <SectionPlaceholder
      titleAr="قسم مشهد ملامح"
      titleEn="MLAMH Scene category"
      descriptionAr={`القسم: ${category}`}
      descriptionEn={`Category: ${category}`}
    />
  );
}
