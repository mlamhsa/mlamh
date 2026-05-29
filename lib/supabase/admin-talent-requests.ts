import { createAdminClient } from "@/lib/supabase/admin";

export type AdminTalentRequest = {
  id: number;
  talent_id: number;
  full_name: string;
  company: string | null;
  email: string;
  phone: string | null;
  project_type: string | null;
  project_details: string | null;
  budget: string | null;
  project_date: string | null;
  status: string;
  created_at: string;
  talents:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }[]
    | null;
};

export async function getAdminTalentRequests(): Promise<
  AdminTalentRequest[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("talent_requests")
    .select(
      `
      *,
      talents (
        id,
        name_en,
        name_ar,
        slug
      )
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[getAdminTalentRequests] ${error.message}`);
  }

  return (data ?? []) as unknown as AdminTalentRequest[];
}