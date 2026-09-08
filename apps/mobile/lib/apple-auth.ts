import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import { supabase } from "@/lib/supabase";

export type NativeAppleAuthResult = {
  ok: boolean;
  canceled?: boolean;
  displayName?: string | null;
};

function formatAppleName(fullName: AppleAuthentication.AppleAuthenticationFullName | null | undefined) {
  if (!fullName) return null;
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())
    .join(" ") || null;
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
