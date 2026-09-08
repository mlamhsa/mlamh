import { router } from "expo-router";

export function goBackOrReplace(fallback: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback as never);
}
