import { RELATED_TALENTS_LIMIT } from "@/lib/constants/ui";
import type { Talent } from "@/lib/types/talent";

export function getRelatedTalents(
  talents: Talent[],
  currentTalent: Talent,
  limit = RELATED_TALENTS_LIMIT
) {
  return talents
    .filter(
      (item) =>
        item.id !== currentTalent.id &&
        item.category_en === currentTalent.category_en
    )
    .slice(0, limit);
}