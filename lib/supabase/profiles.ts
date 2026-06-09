import { createAdminClient } from "@/lib/supabase/admin";

export async function getProfileByUserId(userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getProfileByUserId]", error);
    return null;
  }

  return data;
}

export async function getProfileById(id: number) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getProfileById]", error);
    return null;
  }

  return data;
}

export async function createProfile({
  userId,
  accountType,
  displayName,
  phone,
}: {
  userId: string;
  accountType: "talent" | "publisher";
  displayName?: string;
  phone?: string;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      account_type: accountType,
      display_name: displayName ?? null,
      phone: phone ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`[createProfile] ${error.message}`);
  }

  return data;
}

export async function updateProfile(
  profileId: number,
  values: {
    display_name?: string;
    phone?: string;
    status?: string;
  }
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    throw new Error(`[updateProfile] ${error.message}`);
  }

  return data;
}