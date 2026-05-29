"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = new Set(["new", "contacted", "closed"]);

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

function parseRequestId(formData: FormData) {
  const id = Number(formData.get("id"));

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

export async function updateTalentRequestStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const id = parseRequestId(formData);
  const status = parseStatus(formData);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("talent_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    throw new Error(`[updateTalentRequestStatusAction] ${error.message}`);
  }

  revalidatePath("/admin/requests");
}