import { useEffect } from "react";
import { type Href, router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { getMobileHrefFromNotificationUrl } from "@/lib/deep-links";
import { getDeviceLocale } from "@/lib/i18n";
import { NotificationSyncProvider } from "@/lib/notifications-context";
import { installPushDeepLinkObserver, startPushSessionLifecycle } from "@/lib/push";
import { startAuthSessionLifecycle, supabase } from "@/lib/supabase";

function requiresAuthentication(href: Href) {
  const path = typeof href === "string" ? href : href.pathname;
  return typeof path === "string" && (
    path.startsWith("/conversations/") ||
    path.startsWith("/publisher/") ||
    path === "/applications" ||
    path === "/notifications" ||
    path.startsWith("/profile")
  );
}

export default function RootLayout() {
  useEffect(() => startAuthSessionLifecycle(), []);
  useEffect(() => startPushSessionLifecycle(getDeviceLocale()), []);

  useEffect(() => installPushDeepLinkObserver((url) => {
    const href = getMobileHrefFromNotificationUrl(url);
    if (!href) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session && requiresAuthentication(href)) {
        const next = typeof href === "string" ? href : String(href.pathname ?? "/");
        router.push({ pathname: "/login", params: { next } });
        return;
      }
      router.push(href);
    });
  }), []);

  return (
    <NotificationSyncProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </NotificationSyncProvider>
  );
}
