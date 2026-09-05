import type { Href } from "expo-router";

import type { MobileAccountContext } from "@/lib/account";

export function getAccountHomeHref(account: MobileAccountContext | null | undefined): Href | null {
  if (!account) return null;
  if (account.type === "publisher") {
    return account.entityId && account.onboardingStatus === "completed" ? "/publisher" : "/publisher/setup";
  }
  return account.entityId && account.onboardingStatus === "completed" ? "/opportunities" : "/onboarding";
}
