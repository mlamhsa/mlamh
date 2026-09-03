import type { CountryCode } from "@/lib/markets/countries";
import type { PublicOpportunity } from "@/lib/opportunities/public-contract";

export type PublicOpportunityRow = {
  id: number;
  title: string;
  title_en: string | null;
  slug: string;
  description: string;
  description_en: string | null;
  opportunity_type: string;
  country_code: CountryCode | null;
  currency: string | null;
  city_slug: string | null;
  city_ar: string | null;
  city_en: string | null;
  required_gender: string | null;
  min_age: number | null;
  max_age: number | null;
  compensation_type: "fixed" | "negotiable" | "unpaid" | null;
  budget: string | null;
  company_name: string;
  featured: boolean | null;
  featured_until: string | null;
  managed_by_mlamh: boolean | null;
  expires_at: string | null;
  created_at: string;
  published: boolean;
  status: string;
};

export function toPublicOpportunity(
  row: PublicOpportunityRow,
  locale: "ar" | "en",
): PublicOpportunity {
  const isEnglish = locale === "en";

  return {
    id: row.id,
    title: isEnglish ? row.title_en?.trim() || row.title : row.title,
    slug: row.slug,
    description: isEnglish
      ? row.description_en?.trim() || row.description
      : row.description,
    opportunityType: row.opportunity_type,
    countryCode: row.country_code,
    currency: row.currency,
    citySlug: row.city_slug,
    city: isEnglish ? row.city_en || row.city_ar : row.city_ar || row.city_en,
    requiredGender: row.required_gender,
    minAge: row.min_age,
    maxAge: row.max_age,
    compensationType: row.compensation_type,
    budget: row.budget,
    companyName: row.company_name,
    featured: row.featured === true,
    managedByMlamh: row.managed_by_mlamh === true,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}
