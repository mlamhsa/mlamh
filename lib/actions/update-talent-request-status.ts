"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set(["new", "contacted", "closed"]);

function parseRequestId(formData: FormData) {
  const id = Number(formData.get("request_id"));

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid request id");
  }

  return id;
}

function parseStatus(formData: FormData) {
  const status = formData.get("status");

  if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid request status");
  }

  return status;
}

async function getOwnTalentId() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const supabase = createAdminClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    throw new Error("No linked talent profile found.");
  }

  return talent.id;
}

export async function updateTalentRequestStatusAction(formData: FormData) {
  const requestId = parseRequestId(formData);
  const status = parseStatus(formData);
  const talentId = await getOwnTalentId();

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("talent_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("talent_id", talentId);

  if (error) {
    throw new Error(`[updateTalentRequestStatusAction] ${error.message}`);
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/ar/talent-dashboard/requests");

  redirect("/ar/talent-dashboard/requests?updated=1");
}