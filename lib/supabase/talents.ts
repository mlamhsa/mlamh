import { supabase } from "@/lib/supabase";
import type { Talent } from "@/lib/types/talent";

export async function getTalents(): Promise<Talent[]> {
  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("published", true)
    .eq("status", "approved");

  if (error) {
    console.error("[getTalents]", error.message);
    return [];
  }

  return (data ?? []) as Talent[];
}

export async function getTalentById(id: string): Promise<Talent | null> {
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }

  const { data, error } = await supabase
    .from("talents")
    .select("*")
    .eq("id", numericId)
    .eq("published", true)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Talent;
}