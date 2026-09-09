type FastTrackDecision =
  | "auto_approve"
  | "manual_review"
  | "hold";

export type TalentFastTrackResult = {
  decision: FastTrackDecision;
  reasons: string[];
};

type TalentRecord = Record<string, unknown>;

function hasValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined;
}

export const TALENT_AUTO_APPROVAL_COMPLETION_THRESHOLD = 70;

export function evaluateTalentFastTrackApproval({
  talent,
  completion,
}: {
  talent: TalentRecord;
  completion: number;
}): TalentFastTrackResult {
  const reasons: string[] = [];

  /*
   * Auto approval is intentionally separate from review readiness.
   * A talent may submit once the mandatory approval fields are complete,
   * while auto approval additionally requires a stronger completion score.
   * Optional bio/languages/skills can improve profile strength and ranking,
   * but none of them is a direct hard gate here.
   */
  if (completion < TALENT_AUTO_APPROVAL_COMPLETION_THRESHOLD) {
    reasons.push("profile_completion_below_fast_track_threshold");
  }

  if (!hasValue(talent.image_url)) {
    reasons.push("missing_profile_image");
  }

  if (!hasValue(talent.primary_role)) {
    reasons.push("missing_primary_role");
  }

  if (!hasValue(talent.city_slug)) {
    reasons.push("missing_city");
  }

  const hasName = hasValue(talent.name_ar) || hasValue(talent.name_en);
  if (!hasName) {
    reasons.push("missing_name");
  }

  /*
   * HOLD is reserved for real moderation / duplicate / risk signals once
   * those signals are available. Until then, incomplete fast-track criteria
   * simply route the profile to manual review.
   */
  if (reasons.length > 0) {
    return {
      decision: "manual_review",
      reasons,
    };
  }

  return {
    decision: "auto_approve",
    reasons: [],
  };
}
