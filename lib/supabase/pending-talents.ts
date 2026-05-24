import { createAdminClient } from "@/lib/supabase/admin";
import type { Talent } from "@/lib/types/talent";

export async function getPendingTalents(): Promise<Talent[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("talents")
      .select("*")
      .eq("status", "pending")
      .order("id", { ascending: false });

    if (error) {
      console.error("[getPendingTalents]", error.message);
      return [];
    }

    return (data ?? []) as Talent[];
  } catch (err) {
    console.error("[getPendingTalents]", err);
    return [];
  }
}
