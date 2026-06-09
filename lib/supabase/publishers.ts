import { createAdminClient } from "@/lib/supabase/admin";

export async function getPublisherByProfileId(profileId: number) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("publishers")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    console.error("[getPublisherByProfileId]", error);
    return null;
  }

  return data;
}

export async function getPublisherById(id: number) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("publishers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getPublisherById]", error);
    return null;
  }

  return data;
}

export async function getPublisherByUserId(userId: string) {
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[getPublisherByUserId.profile]", profileError);
    return null;
  }

  const { data: publisher, error: publisherError } = await supabase
    .from("publishers")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError) {
    console.error("[getPublisherByUserId.publisher]", publisherError);
    return null;
  }

  return publisher;
}