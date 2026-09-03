import { useEffect } from "react";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { getMobileHrefFromNotificationUrl } from "@/lib/deep-links";
import { NotificationSyncProvider } from "@/lib/notifications-context";
import { installPushDeepLinkObserver } from "@/lib/push";
import { startAuthSessionLifecycle } from "@/lib/supabase";

export default function RootLayout() {
  useEffect(() => startAuthSessionLifecycle(), []);

  useEffect(() => installPushDeepLinkObserver((url) => {
    const href = getMobileHrefFromNotificationUrl(url);
    if (href) router.push(href);
  }), []);

  return (
    <NotificationSyncProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </NotificationSyncProvider>
  );
}
