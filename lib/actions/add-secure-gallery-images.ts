"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

const MAX_GALLERY_IMAGES = 20;
const CLEAN_MEDIA_BUCKET = "talent-media";

function getLocale(formData: FormData) {
  return formData.get("locale") === "en" ? "en" : "ar";
}

function isOwnedCleanGalleryUrl(urlValue: string, userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    const url = new URL(urlValue);
    const projectUrl = new URL(supabaseUrl);
    if (url.protocol !== "https:" || url.hostname !== projectUrl.hostname) return false;

    const marker = `/storage/v1/object/public/${CLEAN_MEDIA_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return false;

    const objectPath = decodeURIComponent(
      url.pathname.slice(markerIndex + marker.length),
    );

    const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `^${escapedUserId}/gallery/[0-9a-f-]{36}\\.(jpg|png|webp)$`,
      "i",
    ).test(objectPath);
  } catch {
    return false;
  }
}

export async function addSecureGalleryImagesAction(formData: FormData) {
  const locale = getLocale(formData);
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) redirect(`/${locale}/login`);

  const requestedUrls = formData
    .getAll("image_url")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  const cleanUrls = Array.from(new Set(requestedUrls));
  if (cleanUrls.length === 0 || cleanUrls.length > MAX_GALLERY_IMAGES) {
    throw new Error("Invalid gallery image request.");
  }

  if (!cleanUrls.every((url) => isOwnedCleanGalleryUrl(url, user.id))) {
    throw new Error("Gallery image ownership validation failed.");
  }

  const supabase = createAdminClient();
  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id,slug,gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[addSecureGalleryImagesAction:talent] ${talentError.message}`);
  }
  if (!talent) redirect(`/${locale}/talent-dashboard/profile`);

  const currentGallery = Array.from(
    new Set(normalizeGalleryImages(talent.gallery_images).filter(Boolean)),
  );
  const remainingSlots = MAX_GALLERY_IMAGES - currentGallery.length;

  if (remainingSlots <= 0 || cleanUrls.length > remainingSlots) {
    throw new Error("The gallery has reached its image limit.");
  }

  const nextGallery = Array.from(new Set([...currentGallery, ...cleanUrls]));
  const { error: updateError } = await supabase
    .from("talents")
    .update({ gallery_images: nextGallery })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`[addSecureGalleryImagesAction:update] ${updateError.message}`);
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/gallery`);

  if (talent.slug) {
    const slug = encodeURIComponent(talent.slug);
    revalidatePath(`/ar/talent/${slug}`);
    revalidatePath(`/en/talent/${slug}`);
  }

  redirect(`/${locale}/talent-dashboard/gallery?updated=1`);
}
