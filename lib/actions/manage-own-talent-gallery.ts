"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

const LEGACY_GALLERY_BUCKET = "talent-gallery";
const CLEAN_MEDIA_BUCKET = "talent-media";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getLocale(formData: FormData) {
  return getString(formData, "locale") === "en" ? "en" : "ar";
}

async function getOwnTalent(locale: string) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) redirect(`/${locale}/login`);

  const supabase = createAdminClient();
  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id,slug,gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[manageOwnTalentGallery:getOwnTalent] ${talentError.message}`);
  }
  if (!talent) redirect(`/${locale}/talent-dashboard/profile`);

  return { supabase, talent, userId: user.id };
}

function revalidateGalleryPages(locale: string, talentSlug?: string | null) {
  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/gallery`);

  if (talentSlug) {
    const slug = encodeURIComponent(talentSlug);
    revalidatePath(`/ar/talent/${slug}`);
    revalidatePath(`/en/talent/${slug}`);
  }
}

function getOwnedStorageObject(imageUrl: string, userId: string, talentId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const url = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);
    if (url.hostname !== projectUrl.hostname) return null;

    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const objectPart = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    const [bucket, ...pathParts] = objectPart.split("/");
    const path = pathParts.join("/");
    if (!bucket || !path) return null;

    if (
      bucket === LEGACY_GALLERY_BUCKET &&
      (path.startsWith(`${talentId}/`) || path.startsWith(`talents/${talentId}/`))
    ) {
      return { bucket, path };
    }

    if (
      bucket === CLEAN_MEDIA_BUCKET &&
      path.startsWith(`${userId}/gallery/`) &&
      /^[0-9a-f-]{36}\/gallery\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(path)
    ) {
      return { bucket, path };
    }

    return null;
  } catch {
    return null;
  }
}

export async function removeOwnGalleryImageAction(formData: FormData) {
  const locale = getLocale(formData);
  const imageUrl = getString(formData, "image_url");
  if (!imageUrl) throw new Error("Image URL is required.");

  const { supabase, talent, userId } = await getOwnTalent(locale);
  const gallery = normalizeGalleryImages(talent.gallery_images).filter(Boolean);

  if (!gallery.includes(imageUrl)) {
    throw new Error("The selected image does not belong to this gallery.");
  }

  const nextGallery = gallery.filter((item) => item !== imageUrl);
  const { error: updateError } = await supabase
    .from("talents")
    .update({ gallery_images: nextGallery })
    .eq("id", talent.id)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`[removeOwnGalleryImageAction:update] ${updateError.message}`);
  }

  const storageObject = getOwnedStorageObject(imageUrl, userId, String(talent.id));
  if (storageObject) {
    const { error: removeError } = await supabase.storage
      .from(storageObject.bucket)
      .remove([storageObject.path]);

    if (removeError) {
      console.error("[removeOwnGalleryImageAction:storage]", removeError.message);
    }
  }

  revalidateGalleryPages(locale, talent.slug);
  redirect(`/${locale}/talent-dashboard/gallery?updated=1`);
}

export async function reorderOwnGalleryImagesAction(formData: FormData) {
  const locale = getLocale(formData);
  const orderedImagesRaw = getString(formData, "ordered_images");
  if (!orderedImagesRaw) throw new Error("Ordered images are required.");

  let orderedImages: string[];
  try {
    const parsed = JSON.parse(orderedImagesRaw);
    if (!Array.isArray(parsed)) throw new Error("invalid");
    orderedImages = parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    throw new Error("Invalid ordered images payload.");
  }

  const { supabase, talent, userId } = await getOwnTalent(locale);
  const gallery = normalizeGalleryImages(talent.gallery_images).filter(Boolean);
  const allowedImages = new Set(gallery);
  const safeOrderedImages = orderedImages.filter((imageUrl) => allowedImages.has(imageUrl));
  const missingImages = gallery.filter((imageUrl) => !safeOrderedImages.includes(imageUrl));
  const nextGallery = Array.from(new Set([...safeOrderedImages, ...missingImages]));

  const { error } = await supabase
    .from("talents")
    .update({ gallery_images: nextGallery })
    .eq("id", talent.id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`[reorderOwnGalleryImagesAction] ${error.message}`);
  }

  revalidateGalleryPages(locale, talent.slug);
  redirect(`/${locale}/talent-dashboard/gallery?updated=1`);
}
