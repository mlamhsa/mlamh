"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { uploadGalleryImages } from "@/lib/supabase/storage";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

const MAX_UPLOAD_IMAGES = 8;

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

export async function addTalentGalleryImagesAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const talentId = Number(formData.get("talentId"));

  if (!Number.isFinite(talentId) || talentId <= 0) {
    throw new Error("Invalid talent id");
  }

  const files = formData
    .getAll("gallery")
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, MAX_UPLOAD_IMAGES);

  if (files.length === 0) {
    redirect(`/admin/talents/${talentId}/edit`);
  }

  const supabase = createAdminClient();

  const { data: talent, error: fetchError } = await supabase
    .from("talents")
    .select("gallery_images")
    .eq("id", talentId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`[addTalentGalleryImagesAction] ${fetchError.message}`);
  }

  if (!talent) {
    throw new Error("Talent not found");
  }

  const currentGallery = normalizeGalleryImages(talent.gallery_images);
  const uploadedUrls = await uploadGalleryImages(files);

  const nextGallery = Array.from(
    new Set([...currentGallery, ...uploadedUrls])
  );

  const { error: updateError } = await supabase
    .from("talents")
    .update({
      gallery_images: nextGallery,
    })
    .eq("id", talentId);

  if (updateError) {
    throw new Error(`[addTalentGalleryImagesAction] ${updateError.message}`);
  }

  revalidatePath(`/admin/talents/${talentId}/edit`);
  revalidatePath("/admin");

  redirect(`/admin/talents/${talentId}/edit?updated=1`);
}