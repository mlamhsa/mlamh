export type ControlledExecutionChannel = "email" | "buffer";
export type ControlledExecutionMode = "production" | "test";

export type TestModeSettings = {
  enabled: boolean;
  emailAllowlist: string[];
  bufferTargets: Array<"instagram" | "facebook">;
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
