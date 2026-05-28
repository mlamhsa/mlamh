"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

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

export async function setTalentMainImageAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const talentId = Number(formData.get("talentId"));
  const nextMainImage = String(formData.get("imageUrl") ?? "").trim();

  if (!Number.isFinite(talentId) || talentId <= 0) {
    throw new Error("Invalid talent id");
  }

  if (!nextMainImage) {
    throw new Error("Invalid image url");
  }

  const supabase = createAdminClient();

  const { data: talent, error: fetchError } = await supabase
    .from("talents")
    .select("image_url, gallery_images")
    .eq("id", talentId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`[setTalentMainImageAction] ${fetchError.message}`);
  }

  if (!talent) {
    throw new Error("Talent not found");
  }

  const currentMainImage = String(talent.image_url ?? "").trim();
  const currentGallery = normalizeGalleryImages(talent.gallery_images);

  const belongsToThisTalent =
    nextMainImage === currentMainImage || currentGallery.includes(nextMainImage);

  if (!belongsToThisTalent) {
    throw new Error("Image does not belong to this talent gallery.");
  }

  const nextGallery = currentGallery.filter((url) => url !== nextMainImage);

  if (currentMainImage && currentMainImage !== nextMainImage) {
    nextGallery.unshift(currentMainImage);
  }

  const { error: updateError } = await supabase
    .from("talents")
    .update({
      image_url: nextMainImage,
      gallery_images: Array.from(new Set(nextGallery)),
    })
    .eq("id", talentId);

  if (updateError) {
    throw new Error(`[setTalentMainImageAction] ${updateError.message}`);
  }

  revalidatePath(`/admin/talents/${talentId}/edit`);
  revalidatePath("/admin");

  redirect(`/admin/talents/${talentId}/edit?updated=1`);
}