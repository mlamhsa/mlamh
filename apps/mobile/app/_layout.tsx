import { useEffect } from "react";
import * as Linking from "expo-linking";
import { type Href, router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { getMobileHrefFromUrl } from "@/lib/deep-links";
import { getDeviceLocale } from "@/lib/i18n";
import { NotificationSyncProvider } from "@/lib/notifications-context";
import { installPushDeepLinkObserver, startPushSessionLifecycle } from "@/lib/push";
import { startAuthSessionLifecycle, supabase } from "@/lib/supabase";

function requiresAuthentication(href: Href) {
  const path = typeof href === "string" ? href : href.pathname;
  return typeof path === "string" && (
    path.startsWith("/conversations/") ||
    path.startsWith("/publisher/") ||
    path === "/publisher" ||
    path === "/applications" ||
    path === "/notifications" ||
    path.startsWith("/profile")
  );
}

async function routeIncomingUrl(url: string) {
  const href = getMobileHrefFromUrl(url);
  if (!href) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session && requiresAuthentication(href)) {
    const next = typeof href === "string" ? href : String(href.pathname ?? "/");
    router.push({ pathname: "/login", params: { next } });
    return;
  }
  router.push(href);
}

export default function RootLayout() {
  useEffect(() => startAuthSessionLifecycle(), []);
  useEffect(() => startPushSessionLifecycle(getDeviceLocale()), []);

  useEffect(() => {
    let active = true;
    const openUrl = (url: string) => {
      if (active) void routeIncomingUrl(url);
    };

    void Linking.getInitialURL().then((url) => {
      if (url) openUrl(url);
    });
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => openUrl(url));
    const removePushObserver = installPushDeepLinkObserver(openUrl);

    return () => {
      active = false;
      linkingSubscription.remove();
      removePushObserver();
    };
  }, []);

  return (
    <NotificationSyncProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </NotificationSyncProvider>
  );
}
