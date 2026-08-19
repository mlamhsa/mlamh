"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PROFILE_BUCKET = "talent-gallery";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getLocale(formData: FormData) {
  return getString(formData, "locale") === "en" ? "en" : "ar";
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

export async function updateOwnTalentMainImageAction(
  formData: FormData
): Promise<void> {
  const locale = getLocale(formData);
  const file = formData.get("profile_image");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error(
      locale === "ar"
        ? "يرجى اختيار صورة."
        : "Please select an image."
    );
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(
      locale === "ar"
        ? "يسمح برفع الصور فقط."
        : "Only image files are allowed."
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      locale === "ar"
        ? "يجب ألا يتجاوز حجم الصورة 10 ميجابايت."
        : "Image size must not exceed 10MB."
    );
  }

  const extension = getImageExtension(file);

  if (!extension) {
    throw new Error(
      locale === "ar"
        ? "الصيغ المدعومة: JPG وPNG وWEBP."
        : "Supported formats: JPG, PNG, and WEBP."
    );
  }

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    redirect(`/${locale}/login`);
  }

  const supabase = createAdminClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, slug, image_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(
      `[updateOwnTalentMainImageAction:talent] ${talentError.message}`
    );
  }

  if (!talent) {
    redirect(`/${locale}/talent-dashboard/profile`);
  }

  const filePath =
    `${talent.id}/profile-${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `[updateOwnTalentMainImageAction:upload] ${uploadError.message}`
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    await supabase.storage.from(PROFILE_BUCKET).remove([filePath]);
    throw new Error("Failed to generate public image URL.");
  }

  const { error: updateError } = await supabase
  .from("talents")
  .update({
    image_url: publicUrl,
  })
  .eq("id", talent.id);

  if (updateError) {
    await supabase.storage.from(PROFILE_BUCKET).remove([filePath]);

    throw new Error(
      `[updateOwnTalentMainImageAction:update] ${updateError.message}`
    );
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/gallery`);

  if (talent.slug) {
    revalidatePath(
      `/${locale}/talent/${encodeURIComponent(talent.slug)}`
    );
  }

  redirect(`/${locale}/talent-dashboard?profileImageUpdated=1`);
}