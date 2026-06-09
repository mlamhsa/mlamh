import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/lib/types/opportunity";

export async function getPublishedOpportunities(): Promise<Opportunity[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("published", true)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPublishedOpportunities]", error);
    return [];
  }

  return (data ?? []) as Opportunity[];
}

export async function getOpportunityBySlug(
  slug: string
): Promise<Opportunity | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("[getOpportunityBySlug]", error);
    return null;
  }

  return data as Opportunity | null;
}