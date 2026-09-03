import "react-native-url-polyfill/auto";

import { AppState, Platform } from "react-native";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import NativeStorage from "expo-sqlite/kv-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}

const webStorage: SupportedStorage = {
  getItem(key) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

const storage: SupportedStorage = Platform.OS === "web" ? webStorage : NativeStorage;

export const supabase = createClient(url, publishableKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

let authLifecycleStarted = false;

export function startAuthSessionLifecycle() {
  if (authLifecycleStarted) return () => undefined;
  authLifecycleStarted = true;

  if (Platform.OS === "web") {
    supabase.auth.startAutoRefresh();
    return () => {
      supabase.auth.stopAutoRefresh();
      authLifecycleStarted = false;
    };
  }

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
