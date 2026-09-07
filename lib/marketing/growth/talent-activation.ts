export type TalentActivationSnapshot = {
  registrations: number;
  completed: number;
  submitted: number;
  approved: number;
  applications: number;
};

export type TalentActivationStep = {
  key: keyof TalentActivationSnapshot;
  value: number;
  previousValue: number | null;
  conversionFromPrevious: number | null;
  dropoffFromPrevious: number | null;
};

function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export function buildTalentActivationFunnel(snapshot: TalentActivationSnapshot): TalentActivationStep[] {
  const ordered: Array<keyof TalentActivationSnapshot> = ["registrations", "completed", "submitted", "approved", "applications"];
  return ordered.map((key, index) => {
    const value = Math.max(0, snapshot[key] ?? 0);
    const previousValue = index === 0 ? null : Math.max(0, snapshot[ordered[index - 1]] ?? 0);
    const conversionFromPrevious = previousValue === null ? null : pct(value, previousValue);
    return {
      key,
      value,
      previousValue,
      conversionFromPrevious,
      dropoffFromPrevious: conversionFromPrevious === null ? null : Math.max(0, 100 - conversionFromPrevious),
    };
  });
}

export function talentActivationSummary(snapshot: TalentActivationSnapshot) {
  const approvalActivation = pct(snapshot.approved, snapshot.registrations) ?? 0;
  const completionRate = pct(snapshot.completed, snapshot.registrations) ?? 0;
  const submissionRate = pct(snapshot.submitted, snapshot.completed) ?? 0;
  const approvalRate = pct(snapshot.approved, snapshot.submitted) ?? 0;
  const funnel = buildTalentActivationFunnel(snapshot);
  const bottlenecks = funnel
    .filter((step) => step.dropoffFromPrevious !== null)
    .sort((a, b) => (b.dropoffFromPrevious ?? 0) - (a.dropoffFromPrevious ?? 0));

  return {
    approvalActivation,
    completionRate,
    submissionRate,
    approvalRate,
    biggestBottleneck: bottlenecks[0] ?? null,
  };
}
