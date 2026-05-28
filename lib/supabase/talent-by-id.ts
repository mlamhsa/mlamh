import { createAdminClient } from "@/lib/supabase/admin";
import type { Talent } from "@/lib/types/talent";

export async function getTalentById(id: number): Promise<Talent | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`[getTalentById] ${error.message}`);
  }

  return data as Talent | null;
}

export async function getTalentBySlug(slug: string): Promise<Talent | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`[getTalentBySlug] ${error.message}`);
  }

  return data as Talent | null;
}