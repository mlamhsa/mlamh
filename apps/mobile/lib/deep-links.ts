import type { Href } from "expo-router";

const ALLOWED_MLAMH_ORIGINS = new Set(["https://mlamh.net", "https://www.mlamh.net"]);
const SAFE_RELATIVE_BASE = "https://mlamh.net";
const APP_SCHEME = "mlamh:";
const SUPPORT_PATHS = new Set(["support", "privacy", "terms", "refund-policy", "complaints"]);

function getPathSegments(rawUrl: string) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0 || rawUrl.length > 2048) return null;
  if (rawUrl.startsWith("//")) return null;
  let url: URL;
  try { url = rawUrl.startsWith("/") ? new URL(rawUrl, SAFE_RELATIVE_BASE) : new URL(rawUrl); } catch { return null; }
  if (url.protocol === "https:") {
    if (!ALLOWED_MLAMH_ORIGINS.has(url.origin)) return null;
    return url.pathname.split("/").filter(Boolean);
  }
  if (url.protocol === APP_SCHEME) {
    const hostSegment = url.hostname ? [url.hostname] : [];
    return [...hostSegment, ...url.pathname.split("/").filter(Boolean)];
  }
  return null;
}

export function getMobileHrefFromUrl(rawUrl: string): Href | null {
  const segments = getPathSegments(rawUrl);
  if (!segments) return null;
  if (segments[0] === "ar" || segments[0] === "en") segments.shift();

  if (segments[0] === "onboarding") return "/onboarding" as Href;
  if (segments[0] === "reset-password" || segments[0] === "forgot-password") return `/${segments[0]}` as Href;
  if (segments[0] === "casting") return "/casting" as Href;
  if (segments[0] === "opportunities" && segments[1]) return `/opportunities/${encodeURIComponent(segments[1])}` as Href;
  if (segments[0] === "opportunities") return "/opportunities" as Href;
  if (segments[0] === "talent" && segments[1]) return `/talents/${encodeURIComponent(segments[1])}` as Href;
  if (segments[0] === "talents" && segments[1]) return `/talents/${encodeURIComponent(segments[1])}` as Href;
  if (segments[0] === "talent" || segments[0] === "talents") return "/talents" as Href;
  if ((segments[0] === "messages" || segments[0] === "conversations") && segments[1] && /^\d+$/.test(segments[1])) return `/conversations/${segments[1]}` as Href;
  if (segments[0] === "publisher" && segments[1] === "setup") return "/publisher/setup" as Href;
  if (segments[0] === "publisher" && segments[1] === "profile") return "/publisher/profile" as Href;
  if (segments[0] === "publisher" && segments[1] === "verification") return "/publisher/verification" as Href;
  if (segments[0] === "publisher-dashboard" && segments[1] === "profile") return "/publisher/profile" as Href;
  if (segments[0] === "publisher-dashboard" && segments[1] === "verification") return "/publisher/verification" as Href;
  if (segments[0] === "publisher" && segments[1] === "opportunities" && segments[2] && /^\d+$/.test(segments[2])) return `/publisher/opportunities/${segments[2]}` as Href;
  if (segments[0] === "publisher" && segments[1] === "messages") return "/publisher/messages" as Href;
  if (segments[0] === "publisher" && segments.length === 1) return "/publisher" as Href;
  if (segments[0] === "applications") return "/applications" as Href;
  if (segments[0] === "notifications") return "/notifications" as Href;
  if (segments[0] === "profile") return "/profile" as Href;
  if (segments[0] && SUPPORT_PATHS.has(segments[0])) return "/support" as Href;
  if (segments.length === 0 || segments[0] === "home") return "/opportunities" as Href;
  return null;
}

export const getMobileHrefFromNotificationUrl = getMobileHrefFromUrl;
