"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : null;
}

function nullableNumberValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}

function createSlug(value: string, id: number) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base ? `${base}-${id}` : `talent-${id}`;
}

export async function updateTalentAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const id = nullableNumberValue(formData, "id");

  if (!id) {
    throw new Error("Invalid talent id");
  }

  const nameEn = stringValue(formData, "name_en");
  const slug = createSlug(nameEn, id);

  const payload = {
    slug,
    name_en: nameEn,
    name_ar: stringValue(formData, "name_ar"),
    category_en: stringValue(formData, "category_en"),
    category_ar: stringValue(formData, "category_ar"),
    city_en: nullableStringValue(formData, "city_en"),
    city_ar: nullableStringValue(formData, "city_ar"),
    age: nullableNumberValue(formData, "age"),
    height: nullableStringValue(formData, "height"),
    bio_en: nullableStringValue(formData, "bio_en"),
    bio_ar: nullableStringValue(formData, "bio_ar"),
    whatsapp: nullableStringValue(formData, "whatsapp"),
    instagram: nullableStringValue(formData, "instagram"),
    tiktok: nullableStringValue(formData, "tiktok"),
    snapchat: nullableStringValue(formData, "snapchat"),
    portfolio_url: nullableStringValue(formData, "portfolio_url"),
    sort_order: nullableNumberValue(formData, "sort_order"),
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    status: stringValue(formData, "status") || "pending",
  };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("talents")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(`[updateTalentAction] ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/ar/talent");
  revalidatePath("/en/talent");
  revalidatePath(`/ar/talent/${slug}`);
  revalidatePath(`/en/talent/${slug}`);
  revalidatePath(`/admin/talents/${id}/edit`);

  redirect(`/admin/talents/${id}/edit?updated=1`);
}