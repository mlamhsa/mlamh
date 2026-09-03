import type { AppLocale } from "@/lib/i18n";

export type MobileOpportunity = {
  id: number;
  title: string;
  slug: string;
  description: string;
  opportunityType: string;
  countryCode: string | null;
  currency: string | null;
  city: string | null;
  compensationType: "fixed" | "negotiable" | "unpaid" | null;
  budget: string | null;
  companyName: string;
  featured: boolean;
  managedByMlamh: boolean;
  expiresAt: string | null;
  createdAt: string;
};

type OpportunitiesResponse = {
  items: MobileOpportunity[];
  market: string;
  locale: AppLocale;
};

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net").replace(/\/$/, "");

export async function getPublicOpportunities(
  locale: AppLocale,
  market = "SA",
): Promise<OpportunitiesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/opportunities?market=${encodeURIComponent(market)}&locale=${locale}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`OPPORTUNITIES_REQUEST_FAILED:${response.status}`);
  }

  return (await response.json()) as OpportunitiesResponse;
}
