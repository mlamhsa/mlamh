"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitTalentClaimAction(formData: FormData) {
  const talentId = Number(formData.get("talent_id"));

  if (!Number.isFinite(talentId) || talentId <= 0) {
    throw new Error("Invalid talent id");
  }

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from("talent_claim_requests")
    .select("id")
    .eq("talent_id", talentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await adminClient
      .from("talent_claim_requests")
      .insert({
        talent_id: talentId,
        user_id: user.id,
        status: "pending",
      });

    if (insertError) {
      throw new Error(`[submitTalentClaimAction] ${insertError.message}`);
    }
  }

  revalidatePath("/talent-dashboard/claim");
  redirect("/talent-dashboard/claim?submitted=1");
}