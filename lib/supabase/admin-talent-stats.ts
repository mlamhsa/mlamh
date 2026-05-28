import { createAdminClient } from "@/lib/supabase/admin";

type AdminTalentStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

async function countTalentsByStatus(status?: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from("talents")
    .select("id", { count: "exact", head: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`[countTalentsByStatus] ${error.message}`);
  }

  return count ?? 0;
}

export async function getAdminTalentStats(): Promise<AdminTalentStats> {
  const [total, pending, approved, rejected] = await Promise.all([
    countTalentsByStatus(),
    countTalentsByStatus("pending"),
    countTalentsByStatus("approved"),
    countTalentsByStatus("rejected"),
  ]);

  return {
    total,
    pending,
    approved,
    rejected,
  };
}