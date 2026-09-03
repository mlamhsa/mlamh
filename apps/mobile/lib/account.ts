import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net").replace(/\/$/, "");
const DEFAULT_MARKET = (process.env.EXPO_PUBLIC_DEFAULT_MARKET ?? "SA").trim().toUpperCase() || "SA";

export type MobileAccountContext = {
  type: "talent" | "publisher";
  displayName: string | null;
  approvalStatus: string | null;
  status: string | null;
  onboardingStatus: string | null;
  entityId: number | null;
  countryCode: string | null;
};

export async function getMobileAccountContext() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  const response = await fetch(`${API_BASE_URL}/api/account/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) return null;
  const payload = await response.json() as { ok: true; account: MobileAccountContext };
  return payload.account;
}

export async function resolveMobileMarket() {
  const account = await getMobileAccountContext().catch(() => null);
  const countryCode = account?.countryCode?.trim().toUpperCase();
  return countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : DEFAULT_MARKET;
}
