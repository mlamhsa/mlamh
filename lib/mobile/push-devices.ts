import { createAdminClient } from "@/lib/supabase/admin";

export type MobilePushDeviceInput = {
  expoPushToken?: unknown;
  platform?: unknown;
  deviceId?: unknown;
  appVersion?: unknown;
  locale?: unknown;
};

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && value.length <= max ? value : undefined;
}

export async function registerMobilePushDevice(userId: string, input: MobilePushDeviceInput) {
  if (typeof input.expoPushToken !== "string" || !/^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(input.expoPushToken)) {
    return { ok: false as const, code: "INVALID_PUSH_TOKEN" as const };
  }
  if (input.platform !== "ios" && input.platform !== "android") return { ok: false as const, code: "INVALID_PLATFORM" as const };
  if (input.locale !== "ar" && input.locale !== "en") return { ok: false as const, code: "INVALID_LOCALE" as const };
  const deviceId = optionalText(input.deviceId, 160);
  const appVersion = optionalText(input.appVersion, 40);
  if (deviceId === undefined || appVersion === undefined) return { ok: false as const, code: "INVALID_INPUT" as const };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mobile_push_devices")
    .upsert({
      user_id: userId,
      expo_push_token: input.expoPushToken,
      platform: input.platform,
      device_id: deviceId,
      app_version: appVersion,
      locale: input.locale,
      enabled: true,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "expo_push_token" })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[registerMobilePushDevice]", error);
    return { ok: false as const, code: "REGISTER_FAILED" as const };
  }
  return { ok: true as const, id: data.id };
}

export async function unregisterMobilePushDevice(userId: string, rawToken: unknown) {
  if (typeof rawToken !== "string" || rawToken.length > 240) return { ok: false as const, code: "INVALID_PUSH_TOKEN" as const };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mobile_push_devices")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("expo_push_token", rawToken)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false as const, code: "UNREGISTER_FAILED" as const };
  return { ok: true as const, id: data?.id ?? null };
}
