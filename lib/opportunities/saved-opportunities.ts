import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSavedOpportunityState(
  client: SupabaseClient,
  userId: string,
  opportunityId: number,
) {
  const { data, error } = await client
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (error) throw error;
  return { saved: Boolean(data), id: data?.id ?? null };
}

export async function toggleSavedOpportunity(
  client: SupabaseClient,
  userId: string,
  opportunityId: number,
) {
  const existing = await getSavedOpportunityState(client, userId, opportunityId);

  if (existing.id) {
    const { error } = await client
      .from("saved_opportunities")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { saved: false };
  }

  const { error } = await client
    .from("saved_opportunities")
    .insert({ user_id: userId, opportunity_id: opportunityId });
  if (error) throw error;

  return { saved: true };
}

export async function listSavedOpportunities(
  client: SupabaseClient,
  userId: string,
) {
  const { data, error } = await client
    .from("saved_opportunities")
    .select("opportunity_id,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
