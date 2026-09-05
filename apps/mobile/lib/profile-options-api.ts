export type CanonicalMobileOption = { value: string; ar: string; en: string; code?: string };
export type MobileProfileOptionsResponse = { cities: CanonicalMobileOption[]; nationalities: CanonicalMobileOption[] };

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  const parsed = new URL(configured);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  return configured.replace(/\/$/, "");
}

const API_BASE_URL = requireApiBaseUrl();

export async function getCanonicalProfileOptions(): Promise<MobileProfileOptionsResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/profile-options`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const raw = await response.text();
    if (!raw) return null;
    const payload = JSON.parse(raw) as Partial<MobileProfileOptionsResponse>;
    if (!Array.isArray(payload.cities) || !Array.isArray(payload.nationalities)) return null;
    return { cities: payload.cities, nationalities: payload.nationalities };
  } catch { return null; }
}
