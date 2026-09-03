export function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  }

  const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !localHttp) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  }

  return configured.replace(/\/$/, "");
}

export const MOBILE_API_BASE_URL = requireApiBaseUrl();
