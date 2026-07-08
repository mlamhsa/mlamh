import { createAdminClient } from "@/lib/supabase/admin";

export async function getFooter() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("footer_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Footer fetch error:", error);
    return null;
  }

  return data;
}