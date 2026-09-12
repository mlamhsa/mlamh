export type TalentApprovalProfileState = {
  approval_status?: string | null;
  profile_completed_at?: string | null;
  onboarding_step?: string | null;
};

/**
 * Older talent accounts can carry the database default `pending` before they
 * have ever been submitted for review. A real review submission always sets
 * both `profile_completed_at` and `onboarding_step = "profile_review"`.
 *
 * Keep genuinely submitted profiles protected while treating the old default
 * state as the draft state it actually represents.
 */
export function getEffectiveTalentApprovalStatus(
  profile: TalentApprovalProfileState | null | undefined,
) {
  const status = String(profile?.approval_status ?? "not_submitted").trim() || "not_submitted";

  if (
    status === "pending" &&
    !profile?.profile_completed_at &&
    profile?.onboarding_step !== "profile_review"
  ) {
    return "not_submitted";
  }

  return status;
}

export function isLegacyUnsubmittedTalentPending(
  profile: TalentApprovalProfileState | null | undefined,
) {
  return (
    String(profile?.approval_status ?? "").trim() === "pending" &&
    getEffectiveTalentApprovalStatus(profile) === "not_submitted"
  );
}
