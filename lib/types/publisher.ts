export type Publisher = {
  id: number;
  profile_id: number;

  publisher_type: string;
  company_name?: string | null;
  contact_name: string;

  city?: string | null;
  website?: string | null;
  instagram?: string | null;

  verified: boolean;
  created_at: string;
};