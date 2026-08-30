export type Opportunity = {
  id: number;

  title: string;
  title_en?: string | null;
  slug: string;

  description: string;
  description_en?: string | null;

  opportunity_type: string;

  city_slug?: string | null;
  city_ar?: string | null;
  city_en?: string | null;

  required_gender?: string | null;

  min_age?: number | null;
  max_age?: number | null;

  compensation_type?: "fixed" | "negotiable" | "unpaid" | null;
  budget?: string | null;

  company_name: string;

  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;

  status: string;
  published: boolean;

  featured?: boolean | null;
  featured_until?: string | null;

  expires_at?: string | null;

  created_at: string;
  updated_at: string;
};