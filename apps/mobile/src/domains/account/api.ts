import { mobileApiRequest } from "@/src/api/client";
import type { MobileAccountResponse } from "@/src/domains/account/types";

export function getMobileAccountContext() {
  return mobileApiRequest<MobileAccountResponse>("/api/account/me");
}

export function deleteMobileAccount(appleAuthorizationCode?: string) {
  return mobileApiRequest<{ ok: true }>("/api/account/delete", {
    method: "DELETE",
    body: appleAuthorizationCode ? { appleAuthorizationCode } : undefined,
  });
}
