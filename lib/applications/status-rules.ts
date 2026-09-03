export const APPLICATION_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const VALID_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  pending: ["accepted", "rejected"],
  reviewing: ["accepted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
};

export function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export function normalizeApplicationStatus(
  value: string | null | undefined,
): ApplicationStatus {
  return value && isApplicationStatus(value) ? value : "pending";
}

export function canTransitionApplicationStatus(
  current: ApplicationStatus,
  next: ApplicationStatus,
) {
  return VALID_TRANSITIONS[current].includes(next);
}

export function shouldCreateConversation(status: ApplicationStatus) {
  return status === "accepted";
}

export function isFinalApplicationStatus(status: ApplicationStatus) {
  return status === "accepted" || status === "rejected";
}
