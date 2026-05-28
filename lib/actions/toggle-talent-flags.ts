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

  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminUser) {
    throw new Error("Forbidden");
  }
}

function parseTalentId(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid talent id");
  }

  return id;
}

export async function toggleTalentFeaturedAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const id = parseTalentId(formData);
  const nextFeatured = formData.get("featured") !== "true";

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("talents")
    .update({ featured: nextFeatured })
    .eq("id", id);

  if (error) {
    throw new Error(`[toggleTalentFeaturedAction] ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/talent");
}

export async function toggleTalentPublishedAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const id = parseTalentId(formData);
  const nextPublished = formData.get("published") !== "true";

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("talents")
    .update({ published: nextPublished })
    .eq("id", id);

  if (error) {
    throw new Error(`[toggleTalentPublishedAction] ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/talent");
}