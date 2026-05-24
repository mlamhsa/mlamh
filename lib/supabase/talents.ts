import { supabase } from "@/lib/supabase";
import type { Talent } from "@/lib/types/talent";

export async function getTalents(): Promise<Talent[]> {
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  const response = await supabase
    .from("talents")
    .select("*");

  console.log("FULL RESPONSE:", response);

  return (response.data ?? []) as Talent[];
}