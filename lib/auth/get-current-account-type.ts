import { createAdminClient } from "../supabase/admin";
import { createServerSupabaseClient } from "../supabase/server";

export type AccountType = "talent" | "publisher" | "admin";

export async function getCurrentAccountType(): Promise<AccountType | null> {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return null;
  }

  const adminClient = createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return null;
  }

  const accountType =
    profile?.account_type ?? user.user_metadata?.role;

  if (
    accountType === "talent" ||
    accountType === "publisher" ||
    accountType === "admin"
  ) {
    return accountType;
  }

  return null;
}