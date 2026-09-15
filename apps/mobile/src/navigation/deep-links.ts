import type { Href } from "expo-router";

const ALLOWED_MLAMH_ORIGINS = new Set([
  "https://mlamh.net",
  "https://www.mlamh.net",
]);
const SAFE_RELATIVE_BASE = "https://mlamh.net";
const APP_SCHEME = "mlamh:";

function getPathSegments(rawUrl: string) {
  if (typeof rawUrl !== "string" || rawUrl.length === 0 || rawUrl.length > 2048) {
    return null;
  }
  if (rawUrl.startsWith("//")) return null;

  let url: URL;
  try {
    url = rawUrl.startsWith("/")
      ? new URL(rawUrl, SAFE_RELATIVE_BASE)
      : new URL(rawUrl);
  } catch {
    return null;
  }

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
  if (segments.length === 0 || segments[0] === "home") return "/" as Href;

  if ((segments[0] === "talent" || segments[0] === "talents") && segments[1]) {
    return `/talent/${encodeURIComponent(segments[1])}` as Href;
  }
  if (segments[0] === "talent" || segments[0] === "talents") {
    return "/talents" as Href;
  }

  if (segments[0] === "opportunities") {
    if (segments[1] === "quick" || segments[1] === "casting") {
      return "/opportunities" as Href;
    }
    if (segments[1]) {
      return `/opportunities/${encodeURIComponent(segments[1])}` as Href;
    }
    return "/opportunities" as Href;
  }

  if (segments[0] === "casting") return "/casting" as Href;
  if (segments[0] === "applications") return "/applications" as Href;

  if (segments[0] === "scene") {
    if (segments[1] === "category" && segments[2]) {
      return `/scene/category/${encodeURIComponent(segments[2])}` as Href;
    }
    if (segments[1] === "article" && segments[2]) {
      return `/scene/article/${encodeURIComponent(segments[2])}` as Href;
    }
    if (segments[1] === "search") return "/scene" as Href;
    if (segments[1]) {
      return `/scene/article/${encodeURIComponent(segments[1])}` as Href;
    }
    return "/scene" as Href;
  }

  if (
    (segments[0] === "messages" || segments[0] === "conversations") &&
    segments[1] &&
    /^\d+$/.test(segments[1])
  ) {
    return `/messages/${segments[1]}` as Href;
  }

  if (segments[0] === "login") return "/login" as Href;

  // Keep unsupported web-only routes on the website instead of pushing a native
  // route that does not exist yet. Auth callback URLs are consumed before this
  // mapper in AppBootstrap.
  return null;
}

export const getMobileHrefFromNotificationUrl = getMobileHrefFromUrl;
