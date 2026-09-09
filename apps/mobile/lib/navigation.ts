import { type Href, router } from "expo-router";

export type MobileAccountRole = "talent" | "publisher";

export function getRoleMessagesHref(role: MobileAccountRole): Href {
  return role === "publisher" ? "/publisher/messages" : "/messages";
}

export function getRoleSettingsHref(role: MobileAccountRole): Href {
  return role === "publisher" ? "/publisher/settings" : "/profile/settings";
}

/**
 * Use only for screens whose history is safe to revisit. Auth/onboarding screens
 * should prefer deterministic role-aware replacements so guest routes never leak
 * back into an authenticated stack.
 */
export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

/**
 * Leaves an authenticated leaf screen without trusting the native history stack.
 * Always pass the role/profile destination that owns the current screen. This
 * keeps settings, profile, publisher, and opportunity subflows inside the signed-in
 * shell even when the native history still contains login or onboarding routes.
 */
export function leaveAuthenticatedScreen(fallback: Href) {
  router.replace(fallback);
}
