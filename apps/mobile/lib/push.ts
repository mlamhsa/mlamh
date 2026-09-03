import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net").replace(/\/$/, "");

export type PushPreparationResult =
  | { ok: true; token: string }
  | { ok: false; code: "UNSUPPORTED_PLATFORM" | "PHYSICAL_DEVICE_REQUIRED" | "EAS_PROJECT_ID_MISSING" | "PERMISSION_DENIED" | "UNAUTHENTICATED" | "TOKEN_FAILED" | "REGISTER_FAILED" };

function getProjectId() {
  return Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId ?? null;
}

export async function preparePushRegistration(locale: AppLocale): Promise<PushPreparationResult> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return { ok: false, code: "UNSUPPORTED_PLATFORM" };
  if (!Device.isDevice) return { ok: false, code: "PHYSICAL_DEVICE_REQUIRED" };
  const projectId = getProjectId();
  if (!projectId) return { ok: false, code: "EAS_PROJECT_ID_MISSING" };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("mlamh-updates", {
      name: "MLAMH Updates",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.status === "granted" ? existing : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return { ok: false, code: "PERMISSION_DENIED" };

  let expoPushToken: string;
  try {
    expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return { ok: false, code: "TOKEN_FAILED" };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { ok: false, code: "UNAUTHENTICATED" };

  const response = await fetch(`${API_BASE_URL}/api/mobile/devices`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      expoPushToken,
      platform: Platform.OS,
      deviceId: null,
      appVersion: Constants.expoConfig?.version ?? null,
      locale,
    }),
  });
  if (!response.ok) return { ok: false, code: "REGISTER_FAILED" };
  return { ok: true, token: expoPushToken };
}

export async function unregisterPushToken(expoPushToken: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;
  const response = await fetch(`${API_BASE_URL}/api/mobile/devices`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ expoPushToken }),
  });
  return response.ok;
}

export function installPushDeepLinkObserver(onUrl: (url: string) => void) {
  const redirect = (notification: Notifications.Notification) => {
    const url = notification.request.content.data?.url;
    if (typeof url === "string" && (url.startsWith("/") || url.startsWith("https://mlamh.net/"))) onUrl(url);
  };

  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse?.notification) redirect(lastResponse.notification);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => redirect(response.notification));
  return () => subscription.remove();
}
