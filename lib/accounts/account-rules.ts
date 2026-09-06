const RESTRICTED_ACCOUNT_STATUSES = new Set([
  "suspended",
  "blocked",
  "banned",
  "disabled",
]);

export function isRestrictedAccountStatus(status: string | null | undefined) {
  return RESTRICTED_ACCOUNT_STATUSES.has(status?.trim().toLowerCase() ?? "");
}
