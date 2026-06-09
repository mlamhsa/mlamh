export type Talent = {
  id: number;
  slug?: string | null;

  name_en: string;
  name_ar: string;

  display_name_en?: string | null;
  display_name_ar?: string | null;

  category_en: string;
  category_ar: string;
  category_slug?: string | null;

  image_url: string;
  gallery_images?: string[] | string | null;

  featured: boolean;
  sort_order: number | null;
  published: boolean;
  status?: string | null;

  availability_status?: string | null;

  verified?: boolean | null;
  verified_at?: string | null;

  city_en?: string | null;
  city_ar?: string | null;
  city_slug?: string | null;

  age?: number | null;
  height?: string | null;

  gender?: string | null;
  date_of_birth?: string | null;

  nationality?: string | null;
  nationality_slug?: string | null;

  languages?: string[] | null;
  dialects?: string[] | null;
  skills?: string[] | null;

  bio_en?: string | null;
  bio_ar?: string | null;

  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  portfolio_url?: string | null;
};