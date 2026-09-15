import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, type PropsWithChildren } from "react";

import { getDeviceLocale } from "@/src/i18n/locale";
import { getMobileHrefFromUrl } from "@/src/navigation/deep-links";
import {
  installPushDeepLinkObserver,
  startPushSessionLifecycle,
} from "@/src/native/push";
import {
  consumeNativeAuthCallback,
  startAuthSessionLifecycle,
} from "@/src/services/supabase";

async function routeIncomingUrl(rawUrl: string) {
  if (await consumeNativeAuthCallback(rawUrl)) return;
  const href = getMobileHrefFromUrl(rawUrl);
  if (href) router.push(href);
}

export function AppBootstrap({ children }: PropsWithChildren) {
  useEffect(() => {
    const locale = getDeviceLocale();
    const stopAuthLifecycle = startAuthSessionLifecycle();
    const stopPushLifecycle = startPushSessionLifecycle(locale);
    const stopPushObserver = installPushDeepLinkObserver((url) => {
      void routeIncomingUrl(url);
    });

    let active = true;
    void Linking.getInitialURL().then((url) => {
      if (active && url) void routeIncomingUrl(url);
    });

    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      void routeIncomingUrl(url);
    });

    return () => {
      active = false;
      linkSubscription.remove();
      stopPushObserver();
      stopPushLifecycle();
      stopAuthLifecycle();
    };
  }, []);

  return children;
}
