import { supabase } from "@/lib/supabase";

function requireApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!configured) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL for this mobile environment.");
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error("Invalid EXPO_PUBLIC_API_BASE_URL for this mobile environment."); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS except for localhost development.");
  }
  return configured.replace(/\/$/, "");
}

const API_BASE_URL = requireApiBaseUrl();
const DEFAULT_MARKET = process.env.EXPO_PUBLIC_DEFAULT_MARKET?.trim().toUpperCase() ?? "";

export type MobileAccountContext = {
  type: "talent" | "publisher";
  displayName: string | null;
  approvalStatus: string | null;
  status: string | null;
  onboardingStatus: string | null;
  entityId: number | null;
  countryCode: string | null;
};

function isAccountContext(value: unknown): value is MobileAccountContext {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<MobileAccountContext>;
  return account.type === "talent" || account.type === "publisher";
}

export async function getMobileAccountContext() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/account/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
    });
  } catch {
    return null;
  }

  const raw = await response.text().catch(() => "");
  if (!response.ok || !raw) return null;

  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return null; }
  if (!payload || typeof payload !== "object") return null;
  const account = (payload as { account?: unknown }).account;
  return isAccountContext(account) ? account : null;
}

export async function resolveMobileMarket() {
  const account = await getMobileAccountContext().catch(() => null);
  const countryCode = account?.countryCode?.trim().toUpperCase();
  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) return countryCode;
  if (/^[A-Z]{2}$/.test(DEFAULT_MARKET)) return DEFAULT_MARKET;
  throw new Error("Missing EXPO_PUBLIC_DEFAULT_MARKET for unauthenticated or unscoped mobile discovery.");
}
