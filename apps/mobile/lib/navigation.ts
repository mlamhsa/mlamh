import { type Href, router } from "expo-router";

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
 * This intentionally replaces the route because the previous stack may still
 * contain login/signup/onboarding screens from account activation.
 */
export function leaveAuthenticatedScreen(fallback: Href) {
  router.replace(fallback);
}
