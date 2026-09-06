import type { IntelligenceRiskClass } from "@/lib/intelligence/core/types";

export const INTELLIGENCE_EXECUTION_MODE = "shadow" as const;

export type IntelligenceCapabilityKind =
  | "read"
  | "analyze"
  | "score"
  | "rank"
  | "recommend"
  | "draft"
  | "publish"
  | "send"
  | "approve"
  | "reject"
  | "pay"
  | "delete"
  | "mutate_core";

const SHADOW_ALLOWED = new Set<IntelligenceCapabilityKind>([
  "read",
  "analyze",
  "score",
  "rank",
  "recommend",
  "draft",
]);

export function getCapabilityRiskClass(
  capability: IntelligenceCapabilityKind,
): IntelligenceRiskClass {
  if (["read", "analyze", "score", "rank", "recommend", "draft"].includes(capability)) {
    return "green";
  }

  if (["publish", "send"].includes(capability)) {
    return "amber";
  }

  return "red";
}

export function isCapabilityAllowedInShadowMode(
  capability: IntelligenceCapabilityKind,
): boolean {
  return SHADOW_ALLOWED.has(capability);
}
