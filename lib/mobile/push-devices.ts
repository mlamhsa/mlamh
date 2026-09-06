import { createAdminClient } from "@/lib/supabase/admin";

export type MobilePushDeviceInput = {
  expoPushToken?: unknown;
  platform?: unknown;
  deviceId?: unknown;
  appVersion?: unknown;
  locale?: unknown;
};

type PushDbError = { code?: string | null; message?: string | null } | null;

function optionalText(value: unknown, max: number) {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" && value.length <= max ? value : undefined;
}

function validExpoPushToken(value: unknown): value is string {
  return typeof value === "string" && value.length <= 240 && /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(value);
}

function isPushInfrastructureUnavailable(error: PushDbError) {
  const code = error?.code ?? "";
  const message = error?.message?.toLowerCase() ?? "";
  return code === "42P01" || code === "PGRST205" || (message.includes("mobile_push_devices") && message.includes("schema cache"));
}

export async function registerMobilePushDevice(userId: string, input: MobilePushDeviceInput) {
  if (!validExpoPushToken(input.expoPushToken)) return { ok: false as const, code: "INVALID_PUSH_TOKEN" as const };
  if (input.platform !== "ios" && input.platform !== "android") return { ok: false as const, code: "INVALID_PLATFORM" as const };
  if (input.locale !== "ar" && input.locale !== "en") return { ok: false as const, code: "INVALID_LOCALE" as const };
  const deviceId = optionalText(input.deviceId, 160);
  const appVersion = optionalText(input.appVersion, 40);
  if (deviceId === undefined || appVersion === undefined) return { ok: false as const, code: "INVALID_INPUT" as const };

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("mobile_push_devices")
    .select("id,user_id,enabled")
    .eq("expo_push_token", input.expoPushToken)
    .maybeSingle();

  if (existingError) {
    if (isPushInfrastructureUnavailable(existingError)) return { ok: false as const, code: "PUSH_INFRASTRUCTURE_UNAVAILABLE" as const };
    console.error("[registerMobilePushDevice lookup]", existingError);
    return { ok: false as const, code: "REGISTER_FAILED" as const };
  }
  if (existing && existing.user_id !== userId && existing.enabled) {
    return { ok: false as const, code: "TOKEN_IN_USE" as const };
  }

  const now = new Date().toISOString();
  const payload = {
    user_id: userId,
    expo_push_token: input.expoPushToken,
    platform: input.platform,
    device_id: deviceId,
    app_version: appVersion,
    locale: input.locale,
    enabled: true,
    last_seen_at: now,
    updated_at: now,
  };

  const query = existing
    ? supabase.from("mobile_push_devices").update(payload).eq("id", existing.id)
    : supabase.from("mobile_push_devices").insert(payload);
  const { data, error } = await query.select("id").single();

  if (error || !data) {
    if (isPushInfrastructureUnavailable(error)) return { ok: false as const, code: "PUSH_INFRASTRUCTURE_UNAVAILABLE" as const };
    console.error("[registerMobilePushDevice]", error);
    return { ok: false as const, code: "REGISTER_FAILED" as const };
  }
  return { ok: true as const, id: data.id };
}

export async function unregisterMobilePushDevice(userId: string, rawToken: unknown) {
  if (!validExpoPushToken(rawToken)) return { ok: false as const, code: "INVALID_PUSH_TOKEN" as const };
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mobile_push_devices")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("expo_push_token", rawToken)
    .select("id")
    .maybeSingle();
  if (error) {
    if (isPushInfrastructureUnavailable(error)) return { ok: false as const, code: "PUSH_INFRASTRUCTURE_UNAVAILABLE" as const };
    return { ok: false as const, code: "UNREGISTER_FAILED" as const };
  }
  return { ok: true as const, id: data?.id ?? null };
}
