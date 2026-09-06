import { createAdminClient } from "@/lib/supabase/admin";

import {
  evaluateControlledExecution,
  type TestModeSettings,
} from "./controlled-execution-core";

export {
  evaluateControlledExecution,
  type ControlledExecutionChannel,
  type ControlledExecutionInput,
  type ControlledExecutionMode,
  type ControlledExecutionResult,
  type TestModeSettings,
} from "./controlled-execution-core";

export type ProductionExecutionChannel = "email" | "buffer";

export type ExternalExecutionSettings = {
  productionEnabled: boolean;
  productionChannels: ProductionExecutionChannel[];
  dailyEmailLimit: number;
  testMode: TestModeSettings;
};

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

function safeDailyEmailLimit(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 10;
  return Math.max(1, Math.min(Math.trunc(numeric), 100));
}

void evaluateControlledExecution;

export async function getExternalExecutionSettings(): Promise<ExternalExecutionSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_settings")
    .select("key,value")
    .in("key", [
      "external_execution_enabled",
      "external_execution_channels",
      "external_execution_email_daily_limit",
      "external_execution_test_mode",
    ]);
  if (error) {
    return {
      productionEnabled: false,
      productionChannels: [],
      dailyEmailLimit: 10,
      testMode: { enabled: false, emailAllowlist: [], bufferTargets: [] },
    };
  }

  const settings = new Map((data ?? []).map((row) => [row.key, asRecord(row.value)]));
  const production = settings.get("external_execution_enabled") ?? {};
  const channelsSetting = settings.get("external_execution_channels") ?? {};
  const emailLimitSetting = settings.get("external_execution_email_daily_limit") ?? {};
  const test = settings.get("external_execution_test_mode") ?? {};
  const targets = stringArray(test.buffer_targets).filter(
    (value): value is "instagram" | "facebook" => value === "instagram" || value === "facebook",
  );
  const productionChannels = stringArray(channelsSetting.channels).filter(
    (value): value is ProductionExecutionChannel => value === "email" || value === "buffer",
  );

  return {
    productionEnabled: production.enabled === true,
    productionChannels: [...new Set(productionChannels)],
    dailyEmailLimit: safeDailyEmailLimit(emailLimitSetting.limit),
    testMode: {
      enabled: test.enabled === true,
      emailAllowlist: stringArray(test.email_allowlist).map(normalizeEmail),
      bufferTargets: [...new Set(targets)],
    },
  };
}
