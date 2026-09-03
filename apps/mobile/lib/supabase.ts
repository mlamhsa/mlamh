import "react-native-url-polyfill/auto";

import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import Storage from "expo-sqlite/kv-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(url, publishableKey, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

let authLifecycleStarted = false;

export function startAuthSessionLifecycle() {
  if (authLifecycleStarted) return () => undefined;
  authLifecycleStarted = true;

  if (AppState.currentState === "active") {
    supabase.auth.startAutoRefresh();
  }

  const subscription = AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
    authLifecycleStarted = false;
  };
}
