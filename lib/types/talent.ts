/** Row shape for the public.talents table in Supabase */
export type Talent = {
  id: number;
  slug?: string | null;

  name_en: string;
  name_ar: string;

  category_en: string;
  category_ar: string;

  image_url: string;
  gallery_images?: string[] | string | null;

  featured: boolean;
  sort_order: number | null;
  published: boolean;
  status?: string | null;

  city_en?: string | null;
  city_ar?: string | null;
  age?: number | null;
  height?: string | null;

  bio_en?: string | null;
  bio_ar?: string | null;

  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  portfolio_url?: string | null;
};