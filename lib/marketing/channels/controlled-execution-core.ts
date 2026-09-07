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

function evaluateRequestedTestMode(input: ControlledExecutionInput): ControlledExecutionResult {
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

export function evaluateControlledExecution(input: ControlledExecutionInput): ControlledExecutionResult {
  // An explicitly marked sandbox job must remain a sandbox job even when the
  // same channel is also enabled for Production. This keeps QA allowlists and
  // execution_mode semantics authoritative during controlled E2E tests.
  if (input.testModeRequested) return evaluateRequestedTestMode(input);
  if (input.productionEnabled) return { allowed: true, mode: "production" };
  return { allowed: false, reason: "external_execution_disabled" };
}
