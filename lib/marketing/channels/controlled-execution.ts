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

export type ExternalExecutionSettings = {
  productionEnabled: boolean;
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

void evaluateControlledExecution;

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
