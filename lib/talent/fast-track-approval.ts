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
   * Auto approval is intentionally stricter than review readiness.
   * Required profile fields allow submission for review. Fast-track approval
   * additionally requires a strong overall profile score and all safety/data
   * gates below. Optional bio/languages/skills still improve strength/ranking,
   * but are not direct hard gates.
   */
  if (completion < TALENT_AUTO_APPROVAL_COMPLETION_THRESHOLD) {
    reasons.push("profile_completion_below_fast_track_threshold");
  }

  const hasName = hasValue(talent.name_ar) || hasValue(talent.name_en);
  if (!hasName) reasons.push("missing_name");
  if (!hasValue(talent.phone)) reasons.push("missing_phone");
  if (!hasValue(talent.image_url)) reasons.push("missing_profile_image");
  if (!hasValue(talent.primary_role) && !hasValue(talent.category_slug)) reasons.push("missing_primary_role");
  if (!hasValue(talent.city_slug)) reasons.push("missing_city");
  if (!hasValue(talent.gender)) reasons.push("missing_gender");
  if (!hasValue(talent.nationality_slug) && !hasValue(talent.nationality)) reasons.push("missing_nationality");
  if (!hasValue(talent.date_of_birth)) reasons.push("missing_date_of_birth");

  const visibility = String(talent.profile_visibility ?? "").trim().toLowerCase();
  if (visibility !== "public" && visibility !== "private") {
    reasons.push("invalid_profile_visibility");
  }

  if (talent.data_accuracy_contact_consent !== true) {
    reasons.push("missing_data_accuracy_contact_consent");
  }

  /*
   * HOLD is reserved for moderation / duplicate / risk signals once those
   * signals are available. Missing fast-track criteria route to manual review.
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
