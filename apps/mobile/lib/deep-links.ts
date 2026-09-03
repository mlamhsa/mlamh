import type { Href } from "expo-router";

const MLAMH_ORIGIN = "https://mlamh.net";

export function getMobileHrefFromNotificationUrl(rawUrl: string): Href | null {
  let path = rawUrl;
  if (rawUrl.startsWith("https://")) {
    try {
      const url = new URL(rawUrl);
      if (url.origin !== MLAMH_ORIGIN && url.origin !== "https://www.mlamh.net") return null;
      path = url.pathname;
    } catch {
      return null;
    }
  }

  if (!path.startsWith("/")) return null;
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "ar" || segments[0] === "en") segments.shift();

  if (segments[0] === "opportunities" && segments[1]) return `/opportunities/${encodeURIComponent(segments[1])}` as Href;
  if ((segments[0] === "messages" || segments[0] === "conversations") && segments[1] && /^\d+$/.test(segments[1])) return `/conversations/${segments[1]}` as Href;
  if (segments[0] === "applications") return "/applications" as Href;
  if (segments[0] === "notifications") return "/notifications" as Href;
  if (segments.length === 0 || segments[0] === "home") return "/opportunities" as Href;
  return null;
}
