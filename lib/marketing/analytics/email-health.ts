export type EmailHealthLevel = "ok" | "observe" | "warning" | "critical";
export type EmailHealthGuardState = "normal" | "observe" | "review_required" | "hold_new_outreach";

export type EmailHealthAlertCode =
  | "integration_unavailable"
  | "integration_stale"
  | "bounce_rate_high"
  | "low_reply_rate"
  | "followups_due"
  | "insufficient_sample";

export type EmailHealthAlert = {
  code: EmailHealthAlertCode;
  level: Exclude<EmailHealthLevel, "ok">;
  value?: number | string | null;
};

export type EmailHealthInput = {
  published: number;
  humanInbound: number;
  bounces: number;
  followUpsDue: number;
  pendingFollowUpTasks: number;
  emailProductionEnabled: boolean;
  integrationStatus: string | null | undefined;
  lastSuccessAt: string | null | undefined;
  nowMs?: number;
  staleAfterHours?: number;
};

export type EmailHealthResult = {
  level: EmailHealthLevel;
  guardState: EmailHealthGuardState;
  enforced: false;
  alerts: EmailHealthAlert[];
  bounceRate: number;
  replyRate: number;
  integrationAgeHours: number | null;
};

function roundedRate(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

function validTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function evaluateEmailHealth(input: EmailHealthInput): EmailHealthResult {
  const alerts: EmailHealthAlert[] = [];
  const nowMs = input.nowMs ?? Date.now();
  const staleAfterHours = Math.max(1, input.staleAfterHours ?? 6);
  const bounceRate = roundedRate(input.bounces, input.published);
  const replyRate = roundedRate(input.humanInbound, input.published);
  const lastSuccessMs = validTimestamp(input.lastSuccessAt);
  const integrationAgeHours = lastSuccessMs === null
    ? null
    : Math.max(0, Math.round(((nowMs - lastSuccessMs) / 3600000) * 10) / 10);

  if (input.emailProductionEnabled && input.integrationStatus !== "connected") {
    alerts.push({ code: "integration_unavailable", level: "critical", value: input.integrationStatus ?? "unknown" });
  } else if (input.emailProductionEnabled && (integrationAgeHours === null || integrationAgeHours > staleAfterHours)) {
    alerts.push({ code: "integration_stale", level: "critical", value: integrationAgeHours });
  }

  if (input.published >= 10 && bounceRate >= 10) {
    alerts.push({ code: "bounce_rate_high", level: "critical", value: bounceRate });
  }

  if (input.published >= 10 && replyRate < 10) {
    alerts.push({ code: "low_reply_rate", level: "warning", value: replyRate });
  }

  const dueTotal = input.followUpsDue + input.pendingFollowUpTasks;
  if (dueTotal > 0) {
    alerts.push({ code: "followups_due", level: "warning", value: dueTotal });
  }

  if (input.published < 5) {
    alerts.push({ code: "insufficient_sample", level: "observe", value: input.published });
  }

  const hasCritical = alerts.some((alert) => alert.level === "critical");
  const hasWarning = alerts.some((alert) => alert.level === "warning");
  const hasObserve = alerts.some((alert) => alert.level === "observe");
  const level: EmailHealthLevel = hasCritical ? "critical" : hasWarning ? "warning" : hasObserve ? "observe" : "ok";
  const guardState: EmailHealthGuardState = hasCritical
    ? "hold_new_outreach"
    : hasWarning
      ? "review_required"
      : hasObserve
        ? "observe"
        : "normal";

  return {
    level,
    guardState,
    enforced: false,
    alerts,
    bounceRate,
    replyRate,
    integrationAgeHours,
  };
}
