export type LandingEvent = {
  event_name: string;
  anonymous_session_id?: string | null;
  source?: string | null;
  campaign?: string | null;
  metadata?: unknown;
};

export type LandingQualityRow = {
  path: string;
  landingSessions: number;
  registrationSessions: number;
  applicationSessions: number;
  registrationRate: number | null;
  applicationRate: number | null;
  sources: string[];
  campaigns: string[];
};

function meta(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pathFrom(event: LandingEvent) {
  const metadata = meta(event.metadata);
  return text(metadata.landing_path) ?? text(metadata.path);
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

function sessionKey(event: LandingEvent, fallbackIndex: number) {
  return text(event.anonymous_session_id) ?? `legacy:${fallbackIndex}`;
}

export function buildLandingQuality(events: LandingEvent[]): LandingQualityRow[] {
  const groups = new Map<string, {
    landingSessions: Set<string>;
    registrationSessions: Set<string>;
    applicationSessions: Set<string>;
    sources: Set<string>;
    campaigns: Set<string>;
  }>();

  function groupFor(path: string) {
    const existing = groups.get(path);
    if (existing) return existing;
    const created = {
      landingSessions: new Set<string>(),
      registrationSessions: new Set<string>(),
      applicationSessions: new Set<string>(),
      sources: new Set<string>(),
      campaigns: new Set<string>(),
    };
    groups.set(path, created);
    return created;
  }

  events.forEach((event, index) => {
    const metadata = meta(event.metadata);
    const path = pathFrom(event);
    if (!path || !path.startsWith("/")) return;

    const isLandingView = event.event_name === "page_view" && metadata.attribution_landing === true;
    const isRegistration = event.event_name === "registration_completed";
    const isApplication = event.event_name === "application_submitted";
    if (!isLandingView && !isRegistration && !isApplication) return;

    const group = groupFor(path);
    const key = sessionKey(event, index);
    if (isLandingView) group.landingSessions.add(key);
    if (isRegistration && event.anonymous_session_id) group.registrationSessions.add(key);
    if (isApplication && event.anonymous_session_id) group.applicationSessions.add(key);
    if (event.source) group.sources.add(event.source);
    if (event.campaign) group.campaigns.add(event.campaign);
  });

  return [...groups.entries()]
    .map(([path, group]) => ({
      path,
      landingSessions: group.landingSessions.size,
      registrationSessions: group.registrationSessions.size,
      applicationSessions: group.applicationSessions.size,
      registrationRate: pct(group.registrationSessions.size, group.landingSessions.size),
      applicationRate: pct(group.applicationSessions.size, group.landingSessions.size),
      sources: [...group.sources].sort(),
      campaigns: [...group.campaigns].sort(),
    }))
    .filter((row) => row.landingSessions > 0)
    .sort((a, b) => b.registrationSessions - a.registrationSessions || b.applicationSessions - a.applicationSessions || b.landingSessions - a.landingSessions);
}
