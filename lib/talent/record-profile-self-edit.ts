import { trackEvent } from "@/lib/events/track-event";

export async function recordTalentProfileSelfEdit({
  talentId,
  userId,
  section,
  fields,
  approvalStatus,
  isReady,
}: {
  talentId: string | number;
  userId: string;
  section: string;
  fields: string[];
  approvalStatus?: string | null;
  isReady?: boolean | null;
}) {
  const changedFields = Array.from(new Set(fields.filter(Boolean))).sort();
  if (changedFields.length === 0) return;

  await trackEvent({
    type: "talent_profile_updated",
    target: "talent",
    targetId: talentId,
    actorId: userId,
    metadata: {
      source: "talent_self_service",
      section,
      fields: changedFields,
      approval_status: approvalStatus ?? null,
      readiness: typeof isReady === "boolean" ? (isReady ? "ready" : "not_ready") : null,
    },
  });
}
