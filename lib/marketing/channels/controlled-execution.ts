import { createAdminClient } from "@/lib/supabase/admin";

export type ControlledExecutionChannel = "email" | "buffer";
export type ControlledExecutionMode = "production" | "test";

type TestModeSettings = {
  enabled: boolean;
  emailAllowlist: string[];
  bufferTargets: Array<"instagram" | "facebook">;
};

export type ExternalExecutionSettings = {
  productionEnabled: boolean;
  testMode: TestModeSettings;
};

export type ControlledExecutionInput = {
  channel: ControlledExecutionChannel;
  productionEnabled: boolean;
  testModeRequested: boolean;
  testMode: TestModeSettings;
  recipientEmail?: string | null;
  bufferTarget?: string | null;
};

export type ControlledExecutionResult =
  | { allowed: true; mode: ControlledExecutionMode }
  | { allowed: false; reason: string };

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim())
    : [];
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function evaluateControlledExecution(input: ControlledExecutionInput): ControlledExecutionResult {
  if (input.productionEnabled) return { allowed: true, mode: "production" };
  if (!input.testModeRequested) return { allowed: false, reason: "external_execution_disabled" };
  if (!input.testMode.enabled) return { allowed: false, reason: "test_mode_disabled" };

  if (input.channel === "email") {
    const recipient = input.recipientEmail ? normalizeEmail(input.recipientEmail) : "";
    const allowlist = input.testMode.emailAllowlist.map(normalizeEmail);
    if (!recipient || !allowlist.includes(recipient)) {
      return { allowed: false, reason: "test_email_recipient_not_allowlisted" };
    }
    return { allowed: true, mode: "test" };
  }

  const target = input.bufferTarget;
  if ((target !== "instagram" && target !== "facebook") || !input.testMode.bufferTargets.includes(target)) {
    return { allowed: false, reason: "test_buffer_target_not_allowlisted" };
  }
  return { allowed: true, mode: "test" };
}

export async function getExternalExecutionSettings(): Promise<ExternalExecutionSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_settings")
    .select("key,value")
    .in("key", ["external_execution_enabled", "external_execution_test_mode"]);
  if (error) {
    return {
      productionEnabled: false,
      testMode: { enabled: false, emailAllowlist: [], bufferTargets: [] },
    };
  }

  const settings = new Map((data ?? []).map((row) => [row.key, asRecord(row.value)]));
  const production = settings.get("external_execution_enabled") ?? {};
  const test = settings.get("external_execution_test_mode") ?? {};
  const targets = stringArray(test.buffer_targets).filter(
    (value): value is "instagram" | "facebook" => value === "instagram" || value === "facebook",
  );

  return {
    productionEnabled: production.enabled === true,
    testMode: {
      enabled: test.enabled === true,
      emailAllowlist: stringArray(test.email_allowlist).map(normalizeEmail),
      bufferTargets: [...new Set(targets)],
    },
  };
}
