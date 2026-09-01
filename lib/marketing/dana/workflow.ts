import { createHash } from "crypto";

export type WorkflowLockAcquisition<TSnapshot> = {
  owner: boolean;
  snapshot: TSnapshot;
};

type DemandIdentityInput = {
  occurredAt: string;
};

type DemandIdentityClassification = {
  intent: string;
};

type DemandIdentityBrief = {
  talentType: string | null;
  city: string | null;
  requirements: Record<string, unknown>;
};

export async function runWithWorkflowLock<TSnapshot, TResult>(options: {
  acquire: () => Promise<WorkflowLockAcquisition<TSnapshot>>;
  runOwner: (snapshot: TSnapshot) => Promise<TResult>;
  waitForCompleted: (snapshot: TSnapshot) => Promise<TResult>;
}) {
  const acquired = await options.acquire();
  return acquired.owner
    ? options.runOwner(acquired.snapshot)
    : options.waitForCompleted(acquired.snapshot);
}

export function mergeSourceReferences(
  existing: unknown,
  nextReference: string,
) {
  const references = Array.isArray(existing)
    ? existing.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const next = nextReference.trim();
  return [...new Set(next ? [...references, next] : references)];
}

function contextSignature(
  classification: DemandIdentityClassification,
  brief: DemandIdentityBrief,
) {
  return [
    classification.intent,
    brief.talentType ?? "unknown-role",
    brief.city ?? "unknown-city",
    brief.requirements.recurring ? "recurring" : "one-off",
    brief.requirements.social_content ? "social-content" : "general-project",
    typeof brief.requirements.gender === "string"
      ? brief.requirements.gender
      : "any-gender",
  ].join("|");
}

export function commercialDemandWindow(occurredAt: string) {
  const occurred = new Date(occurredAt);
  if (!Number.isFinite(occurred.getTime())) return "unknown-window";
  return `${occurred.getUTCFullYear()}-w${Math.floor(
    (occurred.getTime() - Date.UTC(occurred.getUTCFullYear(), 0, 1)) /
      604800000,
  )}`;
}

export function buildResolvedCommercialDemandKey(
  input: DemandIdentityInput,
  classification: DemandIdentityClassification,
  contactId: number,
  brief: DemandIdentityBrief,
) {
  const identity = `contact:${contactId}`;
  return createHash("sha256")
    .update(
      `${identity}|${contextSignature(classification, brief)}|${commercialDemandWindow(input.occurredAt)}`,
    )
    .digest("hex");
}

export function buildResolvedDemandLookup(
  input: DemandIdentityInput,
  classification: DemandIdentityClassification,
  contactId: number,
  brief: DemandIdentityBrief,
) {
  return {
    resolved_contact_id: contactId,
    context_signature: contextSignature(classification, brief),
    demand_window: commercialDemandWindow(input.occurredAt),
  };
}
