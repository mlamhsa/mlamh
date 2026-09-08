export const MLAMH_WEB_ORIGIN = "https://mlamh.net" as const;
export const MLAMH_APP_SCHEME = "mlamh" as const;

export type MobileDeepLinkTarget =
  | { type: "opportunity"; idOrSlug: string }
  | { type: "talent"; slug: string }
  | { type: "conversation"; conversationId: string }
  | { type: "application"; applicationId?: string }
  | { type: "publisherOpportunity"; opportunityId: string }
  | { type: "publisherSetup" }
  | { type: "publisherProfile" }
  | { type: "publisherVerification" }
  | { type: "casting" }
  | { type: "notifications" }
  | { type: "profile" }
  | { type: "support" }
  | { type: "home" };

function encodePathSegment(value: string) {
  return encodeURIComponent(value.trim());
}

export function getWebPathForDeepLink(target: MobileDeepLinkTarget) {
  switch (target.type) {
    case "opportunity":
      return `/opportunities/${encodePathSegment(target.idOrSlug)}`;
    case "talent":
      return `/talent/${encodePathSegment(target.slug)}`;
    case "conversation":
      return `/messages/${encodePathSegment(target.conversationId)}`;
    case "application":
      return target.applicationId ? `/applications/${encodePathSegment(target.applicationId)}` : "/applications";
    case "publisherOpportunity":
      return `/publisher/opportunities/${encodePathSegment(target.opportunityId)}`;
    case "publisherSetup":
      return "/publisher/setup";
    case "publisherProfile":
      return "/publisher/profile";
    case "publisherVerification":
      return "/publisher/verification";
    case "casting":
      return "/casting";
    case "notifications":
      return "/notifications";
    case "profile":
      return "/profile";
    case "support":
      return "/support";
    default:
      return "/";
  }
}

export function getUniversalLink(target: MobileDeepLinkTarget) {
  return `${MLAMH_WEB_ORIGIN}${getWebPathForDeepLink(target)}`;
}
