import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { NotificationSyncProvider } from "@/lib/notifications-context";
import { startAuthSessionLifecycle } from "@/lib/supabase";

export default function RootLayout() {
  useEffect(() => startAuthSessionLifecycle(), []);

  return (
    <NotificationSyncProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </NotificationSyncProvider>
  );
}
