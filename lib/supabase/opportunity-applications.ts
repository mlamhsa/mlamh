import { createAdminClient } from "@/lib/supabase/admin";

export type TalentOpportunityApplication = {
  id: number;
  status: string | null;
  created_at: string | null;
  opportunity_id: number;
  opportunities:
    | {
        id: number;
        title: string;
        slug: string;
        opportunity_type: string | null;
        city_ar: string | null;
        city_en: string | null;
        company_name: string | null;
        budget: string | null;
      }
    | {
        id: number;
        title: string;
        slug: string;
        opportunity_type: string | null;
        city_ar: string | null;
        city_en: string | null;
        company_name: string | null;
        budget: string | null;
      }[]
    | null;
};

export async function getTalentOpportunityApplications(talentId: number) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunity_id,
      opportunities (
        id,
        title,
        slug,
        opportunity_type,
        city_ar,
        city_en,
        company_name,
        budget
      )
      `
    )
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[getTalentOpportunityApplications] ${error.message}`);
  }

  return (data ?? []) as unknown as TalentOpportunityApplication[];
}