import { getTalentData } from "@/lib/api/talents";

export async function getFeaturedTalents() {
  const talents = await getTalentData();

  return talents.filter((t) => t.featured).slice(0, 6);
}

export async function getLatestTalents() {
  const talents = await getTalentData();

  return talents.filter((t) => !t.featured).slice(0, 6);
}