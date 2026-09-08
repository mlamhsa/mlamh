import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import { supabase } from "@/lib/supabase";

export type NativeAppleAuthResult = {
  ok: boolean;
  canceled?: boolean;
  displayName?: string | null;
};

export type AppleRevocationResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; canceled?: boolean; code: string };

function formatAppleName(fullName: AppleAuthentication.AppleAuthenticationFullName | null | undefined) {
  if (!fullName) return null;
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())
    .join(" ") || null;
}

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  return configured.replace(/\/$/, "");
}

export async function signInWithNativeApple(): Promise<NativeAppleAuthResult> {
  if (Platform.OS !== "ios") return { ok: false };

  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) return { ok: false };

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) return { ok: false };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error || !data.user) return { ok: false };

    const displayName = formatAppleName(credential.fullName);
    if (displayName) {
      await supabase.auth.updateUser({
        data: {
          full_name: displayName,
          given_name: credential.fullName?.givenName ?? null,
          family_name: credential.fullName?.familyName ?? null,
        },
      }).catch(() => undefined);
    }

    return { ok: true, displayName };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
    if (code === "ERR_REQUEST_CANCELED") return { ok: false, canceled: true };
    return { ok: false };
  }
}

export async function revokeNativeAppleAuthorizationForDeletion(): Promise<AppleRevocationResult> {
  if (Platform.OS !== "ios") return { ok: true, skipped: true };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { ok: false, code: "UNAUTHENTICATED" };

  const appleIdentity = userData.user.identities?.find((identity) => identity.provider === "apple");
  if (!appleIdentity) return { ok: true, skipped: true };

  const identityData = appleIdentity.identity_data as Record<string, unknown> | undefined;
  const appleUserId = typeof identityData?.sub === "string" && identityData.sub.trim()
    ? identityData.sub.trim()
    : appleIdentity.id;
  if (!appleUserId) return { ok: false, code: "APPLE_IDENTITY_MISSING" };

  try {
    const refreshed = await AppleAuthentication.refreshAsync({ user: appleUserId });
    const authorizationCode = refreshed.authorizationCode?.trim();
    if (!authorizationCode) return { ok: false, code: "APPLE_AUTHORIZATION_CODE_MISSING" };

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return { ok: false, code: "UNAUTHENTICATED" };

    const response = await fetch(`${requireApiBaseUrl()}/api/account/apple-revoke`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ authorizationCode }),
    });
    const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string } | null;
    if (!response.ok || !payload?.ok) return { ok: false, code: payload?.code ?? "APPLE_REVOCATION_FAILED" };

    return { ok: true };
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
    if (code === "ERR_REQUEST_CANCELED") return { ok: false, canceled: true, code: "APPLE_REAUTH_CANCELED" };
    return { ok: false, code: "APPLE_REAUTH_FAILED" };
  }
}
