import { mobileApiRequest } from "@/src/api/client";
import type { MobileAccountResponse } from "@/src/domains/account/types";

export function getMobileAccountContext() {
  return mobileApiRequest<MobileAccountResponse>("/api/account/me");
}

export function selectMobileAccountType(accountType: "talent" | "publisher") {
  return mobileApiRequest<{ ok: true; accountType: "talent" | "publisher"; existing: boolean }>(
    "/api/account/type",
    {
      method: "POST",
      body: { accountType },
    },
  );
}

export function deleteMobileAccount(appleAuthorizationCode?: string) {
  return mobileApiRequest<{ ok: true }>("/api/account/delete", {
    method: "DELETE",
    body: appleAuthorizationCode ? { appleAuthorizationCode } : undefined,
  });
}
