import * as WebBrowser from "expo-web-browser";

import { consumeNativeAuthCallback, supabase } from "@/src/services/supabase";

const APP_CALLBACK = "mlamh://auth/callback";
const OAUTH_REDIRECT_TO = "https://mlamh.net/auth/callback?mode=native";

export type NativeGoogleSignInResult =
  | { ok: true }
  | { ok: false; canceled?: boolean; message?: string };

export async function signInWithNativeGoogle(): Promise<NativeGoogleSignInResult> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: OAUTH_REDIRECT_TO,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { ok: false, message: error?.message || "GOOGLE_OAUTH_URL_MISSING" };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, APP_CALLBACK);
  if (result.type === "cancel" || result.type === "dismiss") {
    return { ok: false, canceled: true };
  }
  if (result.type !== "success" || !result.url) {
    return { ok: false, message: "GOOGLE_OAUTH_INCOMPLETE" };
  }

  const consumed = await consumeNativeAuthCallback(result.url);
  return consumed ? { ok: true } : { ok: false, message: "GOOGLE_OAUTH_CALLBACK_FAILED" };
}
