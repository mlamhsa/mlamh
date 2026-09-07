export type AiSearchPlatform = "chatgpt" | "perplexity" | "copilot" | "gemini" | "claude";

export type AiSearchEvent = {
  event_name: string;
  anonymous_session_id?: string | null;
  source?: string | null;
  referrer?: string | null;
  metadata?: unknown;
};

export type AiSearchVisibilityRow = {
  platform: AiSearchPlatform;
  observedPageViews: number;
  linkedSessions: number;
  registrationSessions: number;
  applicationSessions: number;
  briefSessions: number;
  registrationRate: number | null;
  applicationRate: number | null;
  briefRate: number | null;
  topPaths: Array<{ path: string; views: number }>;
};

const HOST_RULES: Array<{ platform: AiSearchPlatform; hosts: string[]; sources: string[] }> = [
  { platform: "chatgpt", hosts: ["chatgpt.com", "chat.openai.com"], sources: ["chatgpt", "chatgpt.com", "openai"] },
  { platform: "perplexity", hosts: ["perplexity.ai"], sources: ["perplexity", "perplexity.ai"] },
  { platform: "copilot", hosts: ["copilot.microsoft.com"], sources: ["copilot", "microsoft_copilot"] },
  { platform: "gemini", hosts: ["gemini.google.com"], sources: ["gemini", "google_gemini"] },
  { platform: "claude", hosts: ["claude.ai"], sources: ["claude", "claude.ai", "anthropic"] },
];

function meta(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hostname(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function hostMatches(actual: string, expected: string) {
  return actual === expected || actual.endsWith(`.${expected}`);
}

export function classifyAiSearchEvent(event: AiSearchEvent): AiSearchPlatform | null {
  const host = hostname(event.referrer);
  const source = text(event.source)?.toLowerCase() ?? null;

  for (const rule of HOST_RULES) {
    if (host && rule.hosts.some((candidate) => hostMatches(host, candidate))) {
      return rule.platform;
    }
    if (source && rule.sources.includes(source)) {
      return rule.platform;
    }
  }

  return null;
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : null;
}

function eventPath(event: AiSearchEvent) {
  const metadata = meta(event.metadata);
  const path = text(metadata.path) ?? text(metadata.landing_path);
  return path?.startsWith("/") ? path : null;
}

export function buildAiSearchVisibility(events: AiSearchEvent[]): AiSearchVisibilityRow[] {
  const sessionPlatform = new Map<string, AiSearchPlatform>();
  const pageViewCounts = new Map<AiSearchPlatform, number>();
  const pathCounts = new Map<AiSearchPlatform, Map<string, number>>();

  for (const event of events) {
    if (event.event_name !== "page_view") continue;
    const platform = classifyAiSearchEvent(event);
    if (!platform) continue;

    pageViewCounts.set(platform, (pageViewCounts.get(platform) ?? 0) + 1);
    if (event.anonymous_session_id) sessionPlatform.set(event.anonymous_session_id, platform);

    const path = eventPath(event);
    if (path) {
      const paths = pathCounts.get(platform) ?? new Map<string, number>();
      paths.set(path, (paths.get(path) ?? 0) + 1);
      pathCounts.set(platform, paths);
    }
  }

  const linkedSessions = new Map<AiSearchPlatform, Set<string>>();
  const registrationSessions = new Map<AiSearchPlatform, Set<string>>();
  const applicationSessions = new Map<AiSearchPlatform, Set<string>>();
  const briefSessions = new Map<AiSearchPlatform, Set<string>>();

  for (const [sessionId, platform] of sessionPlatform) {
    const sessions = linkedSessions.get(platform) ?? new Set<string>();
    sessions.add(sessionId);
    linkedSessions.set(platform, sessions);
  }

  for (const event of events) {
    const sessionId = event.anonymous_session_id ?? null;
    if (!sessionId) continue;
    const platform = sessionPlatform.get(sessionId);
    if (!platform) continue;

    const target = event.event_name === "registration_completed"
      ? registrationSessions
      : event.event_name === "application_submitted"
        ? applicationSessions
        : event.event_name === "brief_received"
          ? briefSessions
          : null;
    if (!target) continue;

    const sessions = target.get(platform) ?? new Set<string>();
    sessions.add(sessionId);
    target.set(platform, sessions);
  }

  return HOST_RULES
    .map(({ platform }) => {
      const linked = linkedSessions.get(platform)?.size ?? 0;
      const registrations = registrationSessions.get(platform)?.size ?? 0;
      const applications = applicationSessions.get(platform)?.size ?? 0;
      const briefs = briefSessions.get(platform)?.size ?? 0;
      const topPaths = [...(pathCounts.get(platform)?.entries() ?? [])]
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
        .slice(0, 5);

      return {
        platform,
        observedPageViews: pageViewCounts.get(platform) ?? 0,
        linkedSessions: linked,
        registrationSessions: registrations,
        applicationSessions: applications,
        briefSessions: briefs,
        registrationRate: pct(registrations, linked),
        applicationRate: pct(applications, linked),
        briefRate: pct(briefs, linked),
        topPaths,
      } satisfies AiSearchVisibilityRow;
    })
    .filter((row) => row.observedPageViews > 0 || row.linkedSessions > 0)
    .sort((a, b) => b.briefSessions - a.briefSessions
      || b.applicationSessions - a.applicationSessions
      || b.registrationSessions - a.registrationSessions
      || b.observedPageViews - a.observedPageViews);
}
