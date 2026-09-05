import "react-native-url-polyfill/auto";

import { AppState, Platform } from "react-native";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import NativeStorage from "expo-sqlite/kv-store";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");

const webStorage: SupportedStorage = {
  getItem(key) { if (typeof window === "undefined") return null; return window.localStorage.getItem(key); },
  setItem(key, value) { if (typeof window === "undefined") return; window.localStorage.setItem(key, value); },
  removeItem(key) { if (typeof window === "undefined") return; window.localStorage.removeItem(key); },
};

const storage: SupportedStorage = Platform.OS === "web" ? webStorage : NativeStorage;

export const supabase = createClient(url, publishableKey, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

export async function consumeNativeAuthCallback(rawUrl: string) {
  if (Platform.OS === "web" || typeof rawUrl !== "string" || rawUrl.length > 4096) return false;
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return false; }
  if (parsed.protocol !== "mlamh:") return false;

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const accessToken = fragment.get("access_token") ?? parsed.searchParams.get("access_token");
  const refreshToken = fragment.get("refresh_token") ?? parsed.searchParams.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    return !error;
  }

  const code = parsed.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }
  return false;
}

let authLifecycleStarted = false;
export function startAuthSessionLifecycle() {
  if (authLifecycleStarted) return () => undefined;
  authLifecycleStarted = true;
  if (Platform.OS === "web") {
    supabase.auth.startAutoRefresh();
    return () => { supabase.auth.stopAutoRefresh(); authLifecycleStarted = false; };
  }
  if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
  const subscription = AppState.addEventListener("change", (state) => { if (state === "active") supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh(); });
  return () => { subscription.remove(); supabase.auth.stopAutoRefresh(); authLifecycleStarted = false; };
}
