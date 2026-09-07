export const MARKETING_ATTRIBUTION_COOKIE = "mlamh_marketing_attribution_v1";

export type MarketingAttributionContext = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
};

const MAX_FIELD_LENGTH = 160;

function clean(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
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
