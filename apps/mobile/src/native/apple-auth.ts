import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";

import { supabase } from "@/src/services/supabase";

export type NativeAppleAuthResult =
  | { ok: true; displayName: string | null }
  | { ok: false; canceled?: boolean; code: "UNSUPPORTED" | "UNAVAILABLE" | "TOKEN_MISSING" | "SIGN_IN_FAILED" };

export type AppleDeletionReauthResult =
  | { ok: true; authorizationCode: string }
  | { ok: false; canceled?: boolean; code: "UNSUPPORTED" | "UNAVAILABLE" | "CODE_MISSING" | "SIGN_IN_FAILED" };

function formatAppleName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null | undefined,
) {
  if (!fullName) return null;
  const value = [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((part): part is string => Boolean(part?.trim()))
    .map((part) => part.trim())
    .join(" ");
  return value || null;
}

function isCanceledAppleRequest(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  return code === "ERR_REQUEST_CANCELED";
}

export async function signInWithNativeApple(): Promise<NativeAppleAuthResult> {
  if (Platform.OS !== "ios") return { ok: false, code: "UNSUPPORTED" };

  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) return { ok: false, code: "UNAVAILABLE" };

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) return { ok: false, code: "TOKEN_MISSING" };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error || !data.user) return { ok: false, code: "SIGN_IN_FAILED" };

    const displayName = formatAppleName(credential.fullName);
    if (displayName) {
      await supabase.auth
        .updateUser({
          data: {
            full_name: displayName,
            given_name: credential.fullName?.givenName ?? null,
            family_name: credential.fullName?.familyName ?? null,
          },
        })
        .catch(() => undefined);
    }

    return { ok: true, displayName };
  } catch (error) {
    if (isCanceledAppleRequest(error)) {
      return { ok: false, canceled: true, code: "SIGN_IN_FAILED" };
    }
    return { ok: false, code: "SIGN_IN_FAILED" };
  }
}

export async function requestAppleDeletionAuthorizationCode(): Promise<AppleDeletionReauthResult> {
  if (Platform.OS !== "ios") return { ok: false, code: "UNSUPPORTED" };

  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) return { ok: false, code: "UNAVAILABLE" };

  try {
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    const authorizationCode = credential.authorizationCode?.trim();
    if (!authorizationCode) return { ok: false, code: "CODE_MISSING" };
    return { ok: true, authorizationCode };
  } catch (error) {
    if (isCanceledAppleRequest(error)) {
      return { ok: false, canceled: true, code: "SIGN_IN_FAILED" };
    }
    return { ok: false, code: "SIGN_IN_FAILED" };
  }
}

export async function hasAppleIdentity() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return Boolean(data.user.identities?.some((identity) => identity.provider === "apple"));
}
