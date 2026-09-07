export type PublisherActivationSnapshot = {
  registrations: number;
  profiles: number;
  submitted: number;
  approved: number;
  opportunityPublishers: number;
};

export type PublisherActivationStep = {
  key: "registrations" | "profiles" | "submitted" | "approved";
  value: number;
  previousValue: number | null;
  conversionFromPrevious: number | null;
  dropoffFromPrevious: number | null;
};

function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export function buildPublisherActivationFunnel(
  snapshot: PublisherActivationSnapshot,
): PublisherActivationStep[] {
  const ordered: PublisherActivationStep["key"][] = [
    "registrations",
    "profiles",
    "submitted",
    "approved",
  ];

  return ordered.map((key, index) => {
    const value = Math.max(0, snapshot[key] ?? 0);
    const previousValue =
      index === 0
        ? null
        : Math.max(0, snapshot[ordered[index - 1]] ?? 0);
    const conversionFromPrevious =
      previousValue === null ? null : pct(value, previousValue);

    return {
      key,
      value,
      previousValue,
      conversionFromPrevious,
      dropoffFromPrevious:
        conversionFromPrevious === null
          ? null
          : Math.max(0, 100 - conversionFromPrevious),
    };
  });
}

export function publisherActivationSummary(
  snapshot: PublisherActivationSnapshot,
) {
  const profileRate = pct(snapshot.profiles, snapshot.registrations) ?? 0;
  const submissionRate = pct(snapshot.submitted, snapshot.profiles) ?? 0;
  const approvalRate = pct(snapshot.approved, snapshot.submitted) ?? 0;
  const approvalActivation = pct(snapshot.approved, snapshot.registrations) ?? 0;
  const opportunityActivation =
    pct(snapshot.opportunityPublishers, snapshot.approved) ?? 0;

  const biggestBottleneck = buildPublisherActivationFunnel(snapshot)
    .filter((step) => step.dropoffFromPrevious !== null)
    .sort(
      (a, b) =>
        (b.dropoffFromPrevious ?? 0) - (a.dropoffFromPrevious ?? 0),
    )[0] ?? null;

  return {
    profileRate,
    submissionRate,
    approvalRate,
    approvalActivation,
    opportunityActivation,
    biggestBottleneck,
  };
}
