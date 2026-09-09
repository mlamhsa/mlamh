import { router } from "expo-router";

/**
 * Use only for screens whose history is safe to revisit. Auth/onboarding screens
 * should prefer deterministic role-aware replacements so guest routes never leak
 * back into an authenticated stack.
 */
export function goBackOrReplace(fallback: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback as never);
}

/**
 * Leaves an authenticated leaf screen without trusting the native history stack.
 * This intentionally replaces the route because the previous stack may still
 * contain login/signup/onboarding screens from account activation.
 */
export function leaveAuthenticatedScreen(fallback: string) {
  router.replace(fallback as never);
}
