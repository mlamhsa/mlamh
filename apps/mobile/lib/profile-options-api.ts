export type CanonicalMobileOption = { value: string; ar: string; en: string; code?: string };
export type MobileProfileOptionsResponse = { cities: CanonicalMobileOption[]; nationalities: CanonicalMobileOption[] };

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL for this mobile environment."); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  return configured.replace(/\/$/, "");
}

const API_BASE_URL = requireApiBaseUrl();

function isOption(value: unknown): value is CanonicalMobileOption {
  if (!value || typeof value !== "object") return false;
  const option = value as Partial<CanonicalMobileOption>;
  return typeof option.value === "string" && option.value.trim().length > 0 && typeof option.ar === "string" && option.ar.trim().length > 0 && typeof option.en === "string" && option.en.trim().length > 0 && (option.code === undefined || typeof option.code === "string");
}

function normalizeOptions(values: unknown) {
  if (!Array.isArray(values)) return null;
  const normalized = values.filter(isOption).map((option) => ({
    value: option.value.trim(),
    ar: option.ar.trim(),
    en: option.en.trim(),
    ...(option.code ? { code: option.code.trim().toUpperCase() } : {}),
  }));
  if (normalized.length !== values.length) return null;
  const unique = new Map(normalized.map((option) => [option.value, option]));
  return [...unique.values()];
}

export async function getCanonicalProfileOptions(): Promise<MobileProfileOptionsResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/mobile/profile-options`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const raw = await response.text().catch(() => "");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as { cities?: unknown; nationalities?: unknown };
    const cities = normalizeOptions(payload.cities);
    const nationalities = normalizeOptions(payload.nationalities);
    if (!cities || !nationalities || cities.length === 0 || nationalities.length === 0) return null;
    return { cities, nationalities };
  } catch { return null; }
}
