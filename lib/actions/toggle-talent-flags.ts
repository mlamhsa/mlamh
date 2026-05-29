"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_FEATURED_DAYS = 30;

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

function parseTalentId(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid talent id");
  }

  return id;
}

function getFeaturedUntilDate(days = DEFAULT_FEATURED_DAYS) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString();
}

export async function toggleTalentFeaturedAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const id = parseTalentId(formData);
  const currentlyFeatured = formData.get("featured") === "true";
  const nextFeatured = !currentlyFeatured;

  const supabase = createAdminClient();

  const payload = nextFeatured
    ? {
        featured: true,
        featured_until: getFeaturedUntilDate(),
      }
    : {
        featured: false,
        featured_until: null,
      };

  const { error } = await supabase.from("talents").update(payload).eq("id", id);

  if (error) {
    throw new Error(`[toggleTalentFeaturedAction] ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");
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
  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");
}