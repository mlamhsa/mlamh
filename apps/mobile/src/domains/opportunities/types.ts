export type MobilePublicOpportunity = {
  id: number;
  title: string;
  slug: string;
  description: string;
  opportunityType: string;
  postingMode: "quick" | "casting";
  countryCode: string | null;
  currency: string | null;
  citySlug: string | null;
  city: string | null;
  requiredGender: string | null;
  minAge: number | null;
  maxAge: number | null;
  requiredCount: number | null;
  workDate: string | null;
  workDuration: string | null;
  applicationStartDate: string | null;
  applicationDeadline: string | null;
  roleRequirements: Record<string, unknown>;
  compensationType: "fixed" | "negotiable" | "unpaid" | null;
  budget: string | null;
  companyName: string;
  featured: boolean;
  managedByMlamh: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type MobileOpportunitiesResponse = {
  items: MobilePublicOpportunity[];
  market: string;
  locale: "ar" | "en";
};

export type MobileOpportunityDetailResponse = {
  item: MobilePublicOpportunity;
  market: string;
  locale: "ar" | "en";
};

export type MobileOpportunityResponseResult =
  | {
      ok: true;
      code: "SUCCESS";
      applicationId: number | string;
      opportunityId: number;
      opportunitySlug: string | null;
      postingMode: "quick" | "casting";
      conversationId: number | null;
    }
  | {
      ok: false;
      code: string;
      details?: Record<string, unknown>;
    };
