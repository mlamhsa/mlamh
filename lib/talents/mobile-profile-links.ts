import { createAdminClient } from "@/lib/supabase/admin";

const MAX_URL_LENGTH = 2048;

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function optionalHttpsUrl(value: string) {
  if (!value) return null;
  if (value.length > MAX_URL_LENGTH) return undefined;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !url.hostname || url.hostname === "localhost" || url.hostname === "127.0.0.1") return undefined;
    url.username = ""; url.password = "";
    return url.toString();
  } catch { return undefined; }
}
function optionalPlatformUrl(value: string, platform: "instagram" | "tiktok" | "snapchat") {
  if (!value) return null;
  if (value.length > MAX_URL_LENGTH) return undefined;
  const handle = value.replace(/^@/, "").replace(/^\/+|\/+$/g, "").trim();
  if (/^[A-Za-z0-9._-]+$/.test(handle) && !handle.includes("..")) {
    if (platform === "instagram") return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
    if (platform === "tiktok") return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
    return `https://www.snapchat.com/add/${encodeURIComponent(handle)}`;
  }
  const normalized = optionalHttpsUrl(value);
  if (!normalized) return normalized;
  const url = new URL(normalized);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const allowedHost = `${platform}.com`;
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`) ? url.toString() : undefined;
}

export async function getMobileTalentLinks(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("talents").select("showreel_url,video_intro,instagram,tiktok,snapchat,portfolio_url").eq("user_id", userId).maybeSingle();
  if (error) return { ok: false as const, code: "LOOKUP_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };
  return { ok: true as const, item: {
    showreelUrl: data.showreel_url ?? null,
    videoIntro: data.video_intro ?? null,
    instagram: data.instagram ?? null,
    tiktok: data.tiktok ?? null,
    snapchat: data.snapchat ?? null,
    portfolioUrl: data.portfolio_url ?? null,
  }};
}

export async function updateMobileTalentLinks(userId: string, input: Record<string, unknown>) {
  const raw = {
    showreel_url: clean(input.showreelUrl), video_intro: clean(input.videoIntro), instagram: clean(input.instagram),
    tiktok: clean(input.tiktok), snapchat: clean(input.snapchat), portfolio_url: clean(input.portfolioUrl),
  };
  const payload = {
    showreel_url: optionalHttpsUrl(raw.showreel_url), video_intro: optionalHttpsUrl(raw.video_intro),
    instagram: optionalPlatformUrl(raw.instagram, "instagram"), tiktok: optionalPlatformUrl(raw.tiktok, "tiktok"),
    snapchat: optionalPlatformUrl(raw.snapchat, "snapchat"), portfolio_url: optionalHttpsUrl(raw.portfolio_url),
  };
  if (Object.values(payload).some((value) => value === undefined)) return { ok: false as const, code: "INVALID_LINK" as const };
  const admin = createAdminClient();
  const { data, error } = await admin.from("talents").update(payload).eq("user_id", userId).select("id").maybeSingle();
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };
  return { ok: true as const };
}