import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/lib/types/opportunity";

export async function getPublishedOpportunities(): Promise<Opportunity[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .or("published.eq.true,status.eq.open,status.eq.published")
    .neq("status", "archived")
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
    .or("published.eq.true,status.eq.open,status.eq.published")
    .neq("status", "archived")
    .maybeSingle();

  if (error) {
    console.error("[getOpportunityBySlug]", error);
    return null;
  }

  return data as Opportunity | null;
}