export type Talent = {
  id: number;
  user_id?: string | null;

  slug?: string | null;

  name_en: string;
  name_ar: string;

  display_name_en?: string | null;
  display_name_ar?: string | null;

  category_en: string;
  category_ar: string;
  category_slug?: string | null;

  image_url: string;

  gallery_images?:
    | string[]
    | string
    | null;

  photos?: string[] | null;
  full_body_photos?: string[] | null;

  featured: boolean;
  featured_until?: string | null;

  sort_order: number | null;

  published: boolean;
  status?: string | null;

  availability_status?: string | null;

  verified?: boolean | null;
  verified_at?: string | null;

  is_verified?: boolean | null;
  verified_by?: string | null;

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
  language_level?: string[] | null;

  dialects?: string[] | null;
  skills?: string[] | null;

  bio_en?: string | null;
  bio_ar?: string | null;

  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;

  portfolio_url?: string | null;
  portfolio_links?: string[] | null;

  height_cm?: number | null;
  weight_kg?: number | null;

  eye_color?: string | null;
  hair_color?: string | null;
  hair_type?: string | null;
  skin_color?: string | null;

  clothing_size?: string | null;
  shoe_size?: number | null;

  chest_size?: number | null;
  waist_size?: number | null;
  hip_size?: number | null;

  beard?: boolean | null;
  mustache?: boolean | null;
  hijab?: boolean | null;
  tattoos?: boolean | null;
  scars?: boolean | null;
  glasses?: boolean | null;

  experience_years?: number | null;
  previous_work?: string | null;

  video_intro?: string | null;
  showreel_url?: string | null;

  ready_to_travel?: boolean | null;
  has_passport?: boolean | null;
  has_car?: boolean | null;

  work_outside_city?: boolean | null;
  work_outside_country?: boolean | null;

  last_activity?: string | null;

  // Analytics / Ranking
  profile_completion?: number | null;
  profile_views?: number | null;
  applications_sent?: number | null;

  // Timestamps
  created_at?: string | null;
  updated_at?: string | null;
};