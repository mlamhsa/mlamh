export function asTaskMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function isSafeInternalMarketingTask(task: {
  source: string | null;
  channel: string | null;
  metadata: unknown;
}) {
  return task.source === "autonomous_orchestrator"
    && task.channel === "internal"
    && asTaskMetadata(task.metadata).external_execution === false;
}
