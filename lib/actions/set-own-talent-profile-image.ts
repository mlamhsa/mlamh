"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      return normalizeGallery(JSON.parse(trimmed));
    } catch {
      return [trimmed];
    }
  }

  return [];
}

export async function setOwnTalentProfileImageFromGalleryAction(
  locale: "ar" | "en",
  imageUrl?: string,
) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "انتهت جلسة الدخول. سجّل الدخول ثم حاول مرة أخرى."
          : "Your session expired. Sign in and try again.",
    };
  }

  const adminClient = createAdminClient();
  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, slug, image_url, gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر العثور على ملف الموهبة."
          : "Talent profile could not be found.",
    };
  }

  const gallery = normalizeGallery(talent.gallery_images);
  const requestedImage = (imageUrl ?? "").trim();
  const selectedImage = requestedImage || gallery[0] || "";

  if (!selectedImage || !gallery.includes(selectedImage)) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "ارفع صورة إلى معرض الأعمال أولًا."
          : "Upload an image to your portfolio first.",
    };
  }

  const { error: updateError } = await adminClient
    .from("talents")
    .update({ image_url: selectedImage })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر اعتماد الصورة الشخصية الآن. حاول مرة أخرى."
          : "We couldn't set your profile photo. Try again.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/gallery`);

  if (talent.slug) {
    const encodedSlug = encodeURIComponent(talent.slug);
    revalidatePath(`/ar/talent/${encodedSlug}`);
    revalidatePath(`/en/talent/${encodedSlug}`);
  }

  return {
    success: true,
    imageUrl: selectedImage,
    message:
      locale === "ar"
        ? "تم اعتماد الصورة الشخصية بنجاح."
        : "Profile photo set successfully.",
  };
}
