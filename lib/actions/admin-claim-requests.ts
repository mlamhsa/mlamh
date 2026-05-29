"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function requireAdminUser() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const adminClient = createAdminClient();

  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError || !adminUser) {
    throw new Error("Forbidden");
  }
}

function parseClaimId(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid claim request id");
  }

  return id;
}

export async function approveTalentClaimAction(formData: FormData) {
  await requireAdminUser();

  const id = parseClaimId(formData);
  const supabase = createAdminClient();

  const { data: claim, error: claimError } = await supabase
    .from("talent_claim_requests")
    .select("id, talent_id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (claimError || !claim) {
    throw new Error("Claim request not found");
  }

  const { error: talentError } = await supabase
    .from("talents")
    .update({ user_id: claim.user_id })
    .eq("id", claim.talent_id);

  if (talentError) {
    throw new Error(`[approveTalentClaimAction] ${talentError.message}`);
  }

  const { error: updateError } = await supabase
    .from("talent_claim_requests")
    .update({ status: "approved" })
    .eq("id", id);

  if (updateError) {
    throw new Error(`[approveTalentClaimAction] ${updateError.message}`);
  }

  revalidatePath("/admin/claim-requests");
  revalidatePath("/talent-dashboard");
}

export async function rejectTalentClaimAction(formData: FormData) {
  await requireAdminUser();

  const id = parseClaimId(formData);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("talent_claim_requests")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    throw new Error(`[rejectTalentClaimAction] ${error.message}`);
  }

  revalidatePath("/admin/claim-requests");
}