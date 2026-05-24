/** Row shape for the public.talents table in Supabase */
export type Talent = {
  id: number;
  name_en: string;
  name_ar: string;
  category_en: string;
  category_ar: string;
  image_url: string;
  featured: boolean;
  sort_order: number | null;
  published: boolean;
  city_en?: string | null;
  city_ar?: string | null;
  age?: number | null;
  height?: string | null;
  bio_en?: string | null;
  bio_ar?: string | null;
  whatsapp?: string | null;
  gallery_images?: string[] | string | null;
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;
  portfolio_url?: string | null;
  status?: string | null;
};
