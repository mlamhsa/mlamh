import { supabase } from "@/lib/supabase";
import type { Talent } from "@/lib/types/talent";

export async function getTalents(): Promise<Talent[]> {
  try {
    const { data, error } = await supabase
      .from("talents")
      .select("*");

    if (error) {
      return [];
    }

    return (data ?? []) as Talent[];
  } catch {
    return [];
  }
}