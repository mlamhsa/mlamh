import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireAdminAccess() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/admin-login");
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || profile?.account_type !== "admin") {
    redirect("/admin-login");
  }

  return user;
}