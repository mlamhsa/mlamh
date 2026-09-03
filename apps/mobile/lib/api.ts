import type { AppLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

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

type OpportunityDetailResponse = {
  item: MobileOpportunity;
  market: string;
  locale: AppLocale;
};

export type ApplyResult =
  | {
      ok: true;
      code: "SUCCESS";
      applicationId: number | string;
      opportunityId: number;
      opportunitySlug: string | null;
    }
  | {
      ok: false;
      code:
        | "UNAUTHENTICATED"
        | "INVALID_OPPORTUNITY"
        | "NOT_TALENT"
        | "ACCOUNT_RESTRICTED"
        | "TALENT_NOT_APPROVED"
        | "PROFILE_INCOMPLETE"
        | "OPPORTUNITY_NOT_AVAILABLE"
        | "APPLICATION_WINDOW_CLOSED"
        | "ALREADY_APPLIED"
        | "REQUEST_FAILED"
        | string;
      details?: Record<string, unknown>;
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

export async function getPublicOpportunity(
  identifier: string,
  locale: AppLocale,
  market = "SA",
): Promise<OpportunityDetailResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/opportunities/${encodeURIComponent(identifier)}?market=${encodeURIComponent(market)}&locale=${locale}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`OPPORTUNITY_REQUEST_FAILED:${response.status}`);
  }

  return (await response.json()) as OpportunityDetailResponse;
}

export async function applyToOpportunity(opportunityId: number): Promise<ApplyResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { ok: false, code: "UNAUTHENTICATED" };
  }

  const response = await fetch(`${API_BASE_URL}/api/opportunities/${opportunityId}/apply`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  let result: ApplyResult;
  try {
    result = (await response.json()) as ApplyResult;
  } catch {
    return { ok: false, code: "REQUEST_FAILED" };
  }

  if (!response.ok && result.ok) {
    return { ok: false, code: "REQUEST_FAILED" };
  }

  return result;
}
