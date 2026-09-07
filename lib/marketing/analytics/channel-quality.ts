export type MarketingOutcomeEvent = {
  event_name: string;
  source?: string | null;
  campaign?: string | null;
};

export type ChannelEvidenceTier =
  | "demand_proven"
  | "talent_conversion"
  | "registration_only"
  | "traffic_only";

export type ChannelQualityRow = {
  source: string;
  campaign: string | null;
  visits: number;
  registrations: number;
  applications: number;
  briefs: number;
  registrationRate: number | null;
  applicationRate: number | null;
  briefRate: number | null;
  evidenceTier: ChannelEvidenceTier;
};

function rate(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

function tier(row: Pick<ChannelQualityRow, "visits" | "registrations" | "applications" | "briefs">): ChannelEvidenceTier {
  if (row.briefs > 0) return "demand_proven";
  if (row.applications > 0) return "talent_conversion";
  if (row.registrations > 0) return "registration_only";
  return "traffic_only";
}

function tierRank(value: ChannelEvidenceTier) {
  switch (value) {
    case "demand_proven": return 4;
    case "talent_conversion": return 3;
    case "registration_only": return 2;
    default: return 1;
  }
}

export function buildChannelQuality(events: MarketingOutcomeEvent[]): ChannelQualityRow[] {
  const rows = new Map<string, ChannelQualityRow>();

  for (const event of events) {
    const source = event.source?.trim();
    if (!source) continue;

    const campaign = event.campaign?.trim() || null;
    const key = `${source}\u0000${campaign ?? ""}`;
    const current = rows.get(key) ?? {
      source,
      campaign,
      visits: 0,
      registrations: 0,
      applications: 0,
      briefs: 0,
      registrationRate: null,
      applicationRate: null,
      briefRate: null,
      evidenceTier: "traffic_only" as const,
    };

    if (event.event_name === "page_view") current.visits += 1;
    if (event.event_name === "registration_completed") current.registrations += 1;
    if (event.event_name === "application_submitted") current.applications += 1;
    if (event.event_name === "brief_received") current.briefs += 1;

    rows.set(key, current);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      registrationRate: rate(row.registrations, row.visits),
      applicationRate: rate(row.applications, row.registrations),
      briefRate: rate(row.briefs, row.visits),
      evidenceTier: tier(row),
    }))
    .filter((row) => row.visits + row.registrations + row.applications + row.briefs > 0)
    .sort((a, b) => {
      const tierDelta = tierRank(b.evidenceTier) - tierRank(a.evidenceTier);
      if (tierDelta !== 0) return tierDelta;
      const outcomeDelta = (b.briefs + b.applications + b.registrations) - (a.briefs + a.applications + a.registrations);
      if (outcomeDelta !== 0) return outcomeDelta;
      return b.visits - a.visits;
    });
}
