import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { startAuthSessionLifecycle } from "@/lib/supabase";

export default function RootLayout() {
  useEffect(() => startAuthSessionLifecycle(), []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
