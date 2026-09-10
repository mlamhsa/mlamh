"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateOwnTalentRoleAction(formData: FormData) {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  const role = String(formData.get("primary_role") ?? "").trim().toLowerCase();
  const category = TALENT_CATEGORIES.find((item) => item.slug === role);

  if (!category) {
    throw new Error(locale === "ar" ? "نوع الموهبة غير صالح." : "Invalid talent type.");
  }

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const admin = createAdminClient();
  const { data: talent, error: talentError } = await admin
    .from("talents")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[updateOwnTalentRoleAction:talent] ${talentError.message}`);
  }

  if (!talent) {
    redirect(`/${locale}/talent-dashboard/profile`);
  }

  const { error: updateError } = await admin
    .from("talents")
    .update({
      primary_role: category.slug,
      category_slug: category.slug,
      category_ar: category.ar,
      category_en: category.en,
    })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`[updateOwnTalentRoleAction:update] ${updateError.message}`);
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath("/admin/talents");

  if (talent.slug) {
    const slug = encodeURIComponent(talent.slug);
    revalidatePath(`/ar/talent/${slug}`);
    revalidatePath(`/en/talent/${slug}`);
  }

  redirect(`/${locale}/talent-dashboard/profile?talent_type_updated=1#specialization`);
}
