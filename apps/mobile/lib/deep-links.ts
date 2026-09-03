import type { Href } from "expo-router";

const ALLOWED_MLAMH_ORIGINS = new Set(["https://mlamh.net", "https://www.mlamh.net"]);
const SAFE_RELATIVE_BASE = "https://mlamh.net";

export function getMobileHrefFromNotificationUrl(rawUrl: string): Href | null {
  if (typeof rawUrl !== "string" || rawUrl.length === 0 || rawUrl.length > 2048) return null;
  if (rawUrl.startsWith("//")) return null;

  let url: URL;
  try {
    url = rawUrl.startsWith("/") ? new URL(rawUrl, SAFE_RELATIVE_BASE) : new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !ALLOWED_MLAMH_ORIGINS.has(url.origin)) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] === "ar" || segments[0] === "en") segments.shift();

  if (segments[0] === "opportunities" && segments[1]) return `/opportunities/${encodeURIComponent(segments[1])}` as Href;
  if ((segments[0] === "messages" || segments[0] === "conversations") && segments[1] && /^\d+$/.test(segments[1])) return `/conversations/${segments[1]}` as Href;
  if (segments[0] === "publisher" && segments[1] === "opportunities" && segments[2] && /^\d+$/.test(segments[2])) return `/publisher/opportunities/${segments[2]}` as Href;
  if (segments[0] === "applications") return "/applications" as Href;
  if (segments[0] === "notifications") return "/notifications" as Href;
  if (segments.length === 0 || segments[0] === "home") return "/opportunities" as Href;
  return null;
}
