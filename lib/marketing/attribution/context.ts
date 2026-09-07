export const MARKETING_ATTRIBUTION_COOKIE = "mlamh_marketing_attribution_v1";

export type MarketingAttributionContext = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  landingPath: string | null;
  anonymousSessionId: string | null;
};

const MAX_FIELD_LENGTH = 160;

function clean(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanPath(value: unknown) {
  const path = clean(value, 240);
  if (!path || !path.startsWith("/")) return null;
  return path.split("?")[0]?.split("#")[0] || null;
}

function cleanSessionId(value: unknown) {
  const sessionId = clean(value, 80);
  if (!sessionId) return null;
  return /^[A-Za-z0-9._:-]+$/.test(sessionId) ? sessionId : null;
}

export function sanitizeMarketingAttribution(
  value: unknown,
): MarketingAttributionContext {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    source: clean(input.source, 120),
    medium: clean(input.medium, 120),
    campaign: clean(input.campaign),
    content: clean(input.content),
    term: clean(input.term),
    landingPath: cleanPath(input.landingPath),
    anonymousSessionId: cleanSessionId(input.anonymousSessionId),
  };
}

export function hasMarketingAttribution(
  value: MarketingAttributionContext,
) {
  return Boolean(
    value.source ||
      value.medium ||
      value.campaign ||
      value.content ||
      value.term,
  );
}

export function serializeMarketingAttribution(
  value: MarketingAttributionContext,
) {
  return encodeURIComponent(
    JSON.stringify(sanitizeMarketingAttribution(value)),
  );
}

export function parseMarketingAttributionCookie(
  raw: string | null | undefined,
): MarketingAttributionContext {
  if (!raw) return sanitizeMarketingAttribution(null);

  try {
    const decoded = decodeURIComponent(raw);
    return sanitizeMarketingAttribution(JSON.parse(decoded));
  } catch {
    return sanitizeMarketingAttribution(null);
  }
}
