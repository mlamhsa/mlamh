import { createHash } from "crypto";

export type WorkflowLockAcquisition<TSnapshot> = {
  owner: boolean;
  snapshot: TSnapshot;
};

type DemandIdentityInput = {
  occurredAt: string;
  subject?: string | null;
  message?: string | null;
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

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "");
}

function deriveIdentityBrief(input: DemandIdentityInput): DemandIdentityBrief {
  const text = normalize(`${input.subject ?? ""} ${input.message ?? ""}`);
  const model = ["مودل", "عارضة", "عارض", "model"].some((term) =>
    text.includes(normalize(term)),
  );
  const actor = ["ممثل", "ممثلة", "actor", "actress"].some((term) =>
    text.includes(normalize(term)),
  );
  const talentType = model && actor ? "mixed" : model ? "model" : actor ? "actor" : null;
  const cityAliases: Array<[string, string[]]> = [
    ["Jeddah", ["جدة", "jeddah"]],
    ["Riyadh", ["الرياض", "riyadh"]],
    ["Dammam", ["الدمام", "dammam"]],
    ["Khobar", ["الخبر", "khobar"]],
    ["Makkah", ["مكة", "makkah", "mecca"]],
    ["Madinah", ["المدينة", "madinah", "medina"]],
  ];
  const city =
    cityAliases.find(([, aliases]) =>
      aliases.some((alias) => text.includes(normalize(alias))),
    )?.[0] ?? null;
  const recurring = /(شهري|شهريا|monthly|recurring|متكرر)/i.test(text);
  const socialContent = /(ريلز|reels|social|سوشيال|فيديو|video)/i.test(text);
  const female = /(انثى|أنثى|نسائي|female|woman|women|عارضة|ممثلة)/i.test(text);
  return {
    talentType,
    city,
    requirements: {
      recurring,
      social_content: socialContent,
      ...(female ? { gender: "female" } : {}),
    },
  };
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
  brief: DemandIdentityBrief = deriveIdentityBrief(input),
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
  brief: DemandIdentityBrief = deriveIdentityBrief(input),
) {
  return {
    resolved_contact_id: contactId,
    context_signature: contextSignature(classification, brief),
    demand_window: commercialDemandWindow(input.occurredAt),
  };
}
