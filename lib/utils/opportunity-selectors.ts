import type { Talent } from "@/lib/types/talent";

type ScoringOpportunity = {
  skills?: string[] | null;
  city?: string | null;
};

/**
 * =========================================
 * V2 OPPORTUNITY SCORING SYSTEM
 * =========================================
 * - Skills matching
 * - Experience weight
 * - Profile quality
 * - Availability
 * - Location match
 * - Featured boost
 * =========================================
 */

export function calculateApplicantScore(
  talent: Talent,
  opportunity: ScoringOpportunity,
) {
  let score = 0;

  // 1. Skills match (أهم عامل)
  const opportunitySkills = opportunity.skills ?? [];

if (Array.isArray(talent.skills) && opportunitySkills.length > 0) {
  const matchCount = talent.skills.filter((skill) =>
    opportunitySkills.includes(skill),
  ).length;

  score += matchCount * 25;
}

  // 2. Experience
  score += Math.min((talent.experience_years || 0) * 5, 30);

  // 3. Profile quality
  score += (talent.profile_completion || 0) * 0.3;

  // 4. Availability
  if (talent.ready_to_travel) {
    score += 10;
  }

  // 5. Location match
  if (talent.city_en === opportunity.city) {
    score += 15;
  }

  // 6. Featured boost
  if (talent.featured) {
    score += 10;
  }

  return score;
}

/**
 * =========================================
 * RANK APPLICANTS (SORTED LIST)
 * =========================================
 */

export function rankApplicants(
  talents: Talent[],
  opportunity: ScoringOpportunity,
  limit = 50,
) {
  return talents
    .map((t) => ({
      talent: t,
      score: calculateApplicantScore(t, opportunity),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.talent);
}