export type ChannelExecutionPolicyInput = {
  jobStatus: string;
  approvalId: number | null;
  approvalStatus: string | null;
  approvalTaskMatches: boolean;
  externalExecutionEnabled: boolean;
  idempotencyKey: string | null;
  externalPostId: string | null;
  mode: "publish_now" | "schedule";
  scheduledAt: string | null;
};

export type ChannelExecutionPolicyResult =
  | { allowed: true; duplicate: boolean }
  | { allowed: false; reason: string };

export function evaluateChannelExecutionPolicy(input: ChannelExecutionPolicyInput): ChannelExecutionPolicyResult {
  if (!input.approvalId) return { allowed: false, reason: "missing_approval" };
  if (!input.idempotencyKey) return { allowed: false, reason: "missing_idempotency_key" };
  if (input.jobStatus === "published" || input.externalPostId) return { allowed: true, duplicate: true };
  if (!["approved", "scheduled", "failed"].includes(input.jobStatus)) return { allowed: false, reason: "invalid_job_status" };
  if (!input.approvalTaskMatches || !input.approvalStatus || !["approved", "scheduled"].includes(input.approvalStatus)) return { allowed: false, reason: "invalid_approval" };
  if (input.mode === "schedule" && (input.approvalStatus !== "scheduled" || !input.scheduledAt)) return { allowed: false, reason: "invalid_schedule_approval" };
  if (input.mode === "publish_now" && input.approvalStatus !== "approved") return { allowed: false, reason: "publish_now_not_approved" };
  if (!input.externalExecutionEnabled) return { allowed: false, reason: "external_execution_disabled" };
  return { allowed: true, duplicate: false };
}

export function bufferTargetsFromValues(values: string[], fallbackChannel?: string | null): Array<"instagram" | "facebook"> {
  const explicit = values.filter((value): value is "instagram" | "facebook" => value === "instagram" || value === "facebook");
  if (explicit.length) return [...new Set(explicit)];
  const normalized = (fallbackChannel ?? "").toLowerCase();
  if (normalized === "instagram") return ["instagram"];
  if (normalized === "facebook") return ["facebook"];
  if (["buffer", "social", "instagram+facebook", "facebook+instagram"].includes(normalized)) return ["instagram", "facebook"];
  return [];
}
