import { createAdminClient } from "@/lib/supabase/admin";

export class TalentDashboardService {
  static async getDashboard(talentId: number) {
    const supabase = createAdminClient();

    const { data: talent, error } = await supabase
      .from("talents")
      .select("*")
      .eq("id", talentId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `[TalentDashboardService] ${error.message}`
      );
    }

    if (!talent) {
      return {
        talent: null,
      };
    }

    return {
      talent,
    };
  }
}