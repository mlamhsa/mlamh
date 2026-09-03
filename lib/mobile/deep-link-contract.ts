export const MLAMH_WEB_ORIGIN = "https://mlamh.net" as const;
export const MLAMH_APP_SCHEME = "mlamh" as const;

export type MobileDeepLinkTarget =
  | { type: "opportunity"; idOrSlug: string }
  | { type: "conversation"; conversationId: string }
  | { type: "application"; applicationId: string }
  | { type: "notifications" }
  | { type: "home" };

export function getWebPathForDeepLink(target: MobileDeepLinkTarget) {
  switch (target.type) {
    case "opportunity":
      return `/opportunities/${target.idOrSlug}`;
    case "conversation":
      return `/messages/${target.conversationId}`;
    case "application":
      return `/applications/${target.applicationId}`;
    case "notifications":
      return "/notifications";
    default:
      return "/";
  }
}

export function getUniversalLink(target: MobileDeepLinkTarget) {
  return `${MLAMH_WEB_ORIGIN}${getWebPathForDeepLink(target)}`;
}
