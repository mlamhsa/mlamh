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

export function evaluateTalentFastTrackApproval({
  talent,
  completion,
}: {
  talent: TalentRecord;
  completion: number;
}): TalentFastTrackResult {
  const reasons: string[] = [];

  /*
   * 35% يسمح بالإرسال للمراجعة.
   * Fast Track يحتاج جودة أعلى.
   */
  if (completion < 70) {
    reasons.push(
      "profile_completion_below_fast_track_threshold",
    );
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

  const hasName =
    hasValue(talent.name_ar) ||
    hasValue(talent.name_en);

  if (!hasName) {
    reasons.push("missing_name");
  }

  /*
   * نحتاج نبذة فعلية، وليس مجرد ملف تقني مكتمل.
   */
  const hasBio =
    hasValue(talent.bio_ar) ||
    hasValue(talent.bio_en);

  if (!hasBio) {
    reasons.push("missing_bio");
  }

  /*
   * لا نستخدم HOLD بعد.
   * سنفعله فقط عندما يكون لدينا
   * risk / moderation / duplicate signals حقيقية.
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