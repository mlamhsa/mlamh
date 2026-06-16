import { RELATED_TALENTS_LIMIT } from "@/lib/constants/ui";
import type { Talent } from "@/lib/types/talent";

/**
 * Related Talents Scoring System (V2 Smart)
 * يعتمد على:
 * - نفس التصنيف
 * - نفس المدينة
 * - Featured status
 * - Profile completion
 * - Views popularity
 */
function calculateRelatedScore(talent: Talent, current: Talent) {
  let score = 0;

  // 1. نفس التصنيف (أقوى عامل)
  if (talent.category_en === current.category_en) {
    score += 50;
  }

  // 2. نفس المدينة
  if (talent.city_en && talent.city_en === current.city_en) {
    score += 20;
  }

  // 3. Featured boost
  if (talent.featured) {
    score += 15;
  }

  // 4. Profile completion (0 - 100)
  score += (talent.profile_completion || 0) * 0.3;

  // 5. Views popularity (normalized)
  score += Math.min((talent.profile_views || 0) / 10, 10);

  return score;
}

/**
 * Get Related Talents (Smart Ranked)
 */
export function getRelatedTalents(
  talents: Talent[],
  currentTalent: Talent,
  limit = RELATED_TALENTS_LIMIT
) {
  return talents
    .filter((item) => item.id !== currentTalent.id)
    .sort((a, b) => {
      return (
        calculateRelatedScore(b, currentTalent) -
        calculateRelatedScore(a, currentTalent)
      );
    })
    .slice(0, limit);
}

/**
 * Trending Score (Future use for homepage)
 */
export function calculateTrendingScore(talent: Talent) {
  const views = talent.profile_views || 0;
  const applications = talent.applications_sent || 0;
  const completion = talent.profile_completion || 0;

  const featuredBoost = talent.featured ? 20 : 0;

  const viewsScore = Math.min(views / 5, 25);
  const appScore = Math.min(applications * 3, 25);

  return completion * 0.4 + viewsScore + appScore + featuredBoost;
}

/**
 * Get Trending Talents
 */
export function getTrendingTalents(
  talents: Talent[],
  limit = 10
) {
  return talents
    .sort((a, b) => {
      return calculateTrendingScore(b) - calculateTrendingScore(a);
    })
    .slice(0, limit);
}

/**
 * Rising Talents (Fast growth talents)
 */
export function getRisingTalents(
  talents: Talent[],
  limit = 10
) {
  return talents
    .filter((t) => (t.profile_completion || 0) > 40)
    .sort((a, b) => {
      const aGrowth =
        (a.profile_views || 0) + (a.applications_sent || 0);

      const bGrowth =
        (b.profile_views || 0) + (b.applications_sent || 0);

      return bGrowth - aGrowth;
    })
    .slice(0, limit);
}