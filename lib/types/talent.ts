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
};
