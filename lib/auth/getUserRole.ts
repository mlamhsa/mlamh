import { createAdminClient } from "@/lib/supabase/admin";

export async function getUserRole(userId: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.account_type;
}