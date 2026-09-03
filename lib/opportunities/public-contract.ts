import type { CountryCode } from "@/lib/markets/countries";

export type PublicOpportunity = {
  id: number;
  title: string;
  slug: string;
  description: string;
  opportunityType: string;
  countryCode: CountryCode | null;
  currency: string | null;
  citySlug: string | null;
  city: string | null;
  requiredGender: string | null;
  minAge: number | null;
  maxAge: number | null;
  compensationType: "fixed" | "negotiable" | "unpaid" | null;
  budget: string | null;
  companyName: string;
  featured: boolean;
  managedByMlamh: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type PublicOpportunitiesResponse = {
  items: PublicOpportunity[];
  market: CountryCode;
  locale: "ar" | "en";
};
