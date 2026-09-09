"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PROFILE_IMAGE_BUCKET = "talent-gallery";
const MAX_PROFILE_IMAGE_SIZE = 10 * 1024 * 1024;

function getLocale(formData: FormData) {
  return formData.get("locale") === "en" ? "en" : "ar";
}

function getImageExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && ["jpg", "jpeg", "png", "webp"].includes(extension)) {
    return extension;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return null;
}

function validateProfileImage(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("A profile image is required.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("The selected file must be an image.");
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    throw new Error("The profile image must be 10MB or less.");
  }

  const extension = getImageExtension(file);
  if (!extension) {
    throw new Error("The profile image must be JPG, JPEG, PNG, or WEBP.");
  }

  return extension;
}

function ownProfileStoragePath(imageUrl: string | null | undefined, talentId: string) {
  if (!imageUrl) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const url = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);
    if (url.hostname !== projectUrl.hostname) return null;

    const marker = `/storage/v1/object/public/${PROFILE_IMAGE_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const path = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return path.startsWith(`profile/${talentId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function updateOwnTalentProfileImageAction(formData: FormData) {
  const locale = getLocale(formData);
  const image = formData.get("profile_image");

  if (!(image instanceof File)) {
    throw new Error("A profile image is required.");
  }

  const extension = validateProfileImage(image);
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
    .select("id, slug, image_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[updateOwnTalentProfileImageAction:talent] ${talentError.message}`);
  }

  if (!talent) {
    redirect(`/${locale}/talent-dashboard/profile`);
  }

  const talentId = String(talent.id);
  const filePath = `profile/${talentId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(filePath, image, {
      contentType: image.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`[updateOwnTalentProfileImageAction:upload] ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    await admin.storage.from(PROFILE_IMAGE_BUCKET).remove([filePath]);
    throw new Error("Failed to create the profile image URL.");
  }

  const { error: updateError } = await admin
    .from("talents")
    .update({ image_url: publicUrl })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    await admin.storage.from(PROFILE_IMAGE_BUCKET).remove([filePath]);
    throw new Error(`[updateOwnTalentProfileImageAction:update] ${updateError.message}`);
  }

  // Only delete an older file if it was created by this explicit profile-image
  // flow. Legacy/external images are never deleted automatically.
  const oldPath = ownProfileStoragePath(talent.image_url, talentId);
  if (oldPath && oldPath !== filePath) {
    const { error: cleanupError } = await admin.storage
      .from(PROFILE_IMAGE_BUCKET)
      .remove([oldPath]);

    if (cleanupError) {
      console.error("[updateOwnTalentProfileImageAction:cleanup]", cleanupError.message);
    }
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath("/admin/talents");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${encodeURIComponent(talent.slug)}`);
    revalidatePath(`/en/talent/${encodeURIComponent(talent.slug)}`);
  }

  redirect(`/${locale}/talent-dashboard/profile?profile_image_updated=1#identity`);
}
