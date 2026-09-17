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

export function finalizeMobileAccount(input: { displayName: string; phone: string; accountType: "talent" | "publisher" }) {
  return mobileApiRequest<{ ok: true; accountType: "talent" | "publisher" }>("/api/account/details", {
    method: "POST",
    body: input,
  });
}

export function completeMobilePublisherOnboarding(input: { publisherMode: "individual" | "organization"; publisherType: string }) {
  return mobileApiRequest<{ ok: true; publisherId: number; publisherType: string }>("/api/publisher/onboarding", {
    method: "POST",
    body: input,
  });
}

export function completeMobileTalentOnboarding(talentType: "actor" | "model") {
  return mobileApiRequest<{ ok: true; talentId: number; talentType: "actor" | "model" }>("/api/talent/onboarding", {
    method: "POST",
    body: { talentType },
  });
}

export function deleteMobileAccount(appleAuthorizationCode?: string) {
  return mobileApiRequest<{ ok: true }>("/api/account/delete", {
    method: "DELETE",
    body: appleAuthorizationCode ? { appleAuthorizationCode } : undefined,
  });
}
