"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GALLERY_BUCKET = "talent-gallery";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeGallery(parsed);
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }

  return [];
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getImageExtension(file: File) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (
    extensionFromName &&
    ["jpg", "jpeg", "png", "webp"].includes(extensionFromName)
  ) {
    return extensionFromName;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return null;
}

function getStorageObjectFromPublicUrl(imageUrl: string, talentId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return null;

  try {
    const url = new URL(imageUrl);
    const projectUrl = new URL(supabaseUrl);

    if (url.hostname !== projectUrl.hostname) return null;

    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    const objectPart = decodeURIComponent(
      url.pathname.slice(markerIndex + marker.length)
    );

    const [bucket, ...pathParts] = objectPart.split("/");
    const path = pathParts.join("/");

    if (!bucket || !path) return null;

    const allowedBuckets = ["talent-gallery", "talent-images"];

    if (!allowedBuckets.includes(bucket)) return null;

    const belongsToTalent =
      path.startsWith(`${talentId}/`) || path.startsWith(`talents/${talentId}/`);

    if (!belongsToTalent) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

async function getOwnTalent() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) redirect("/talent-login");

  const supabase = createAdminClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, slug, image_url, gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    throw new Error("No linked talent profile found.");
  }

  return { supabase, talent };
}

export async function addOwnGalleryImageAction(formData: FormData) {
  const file = formData.get("image_file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Image file is required.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image size must be 10MB or less.");
  }

  const extension = getImageExtension(file);

  if (!extension) {
    throw new Error("Only JPG, PNG, and WEBP images are supported.");
  }

  const { supabase, talent } = await getOwnTalent();
  const gallery = normalizeGallery(talent.gallery_images);

  const filePath = `${talent.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`[addOwnGalleryImageAction:upload] ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    throw new Error("Failed to generate public image URL.");
  }

  const nextGallery = Array.from(new Set([...gallery, publicUrl]));

  const { error } = await supabase
    .from("talents")
    .update({
      gallery_images: nextGallery,
      image_url: talent.image_url || publicUrl,
    })
    .eq("id", talent.id);

  if (error) throw new Error(`[addOwnGalleryImageAction] ${error.message}`);

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/gallery");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/ar/talent-dashboard/gallery?updated=1");
}

export async function removeOwnGalleryImageAction(formData: FormData) {
  const imageUrl = getString(formData, "image_url");

  if (!imageUrl) throw new Error("Image URL is required.");

  const { supabase, talent } = await getOwnTalent();
  const gallery = normalizeGallery(talent.gallery_images);

  const nextGallery = gallery.filter((item) => item !== imageUrl);

  const { error } = await supabase
    .from("talents")
    .update({
      gallery_images: nextGallery,
      image_url:
        talent.image_url === imageUrl ? nextGallery[0] ?? null : talent.image_url,
    })
    .eq("id", talent.id);

  if (error) throw new Error(`[removeOwnGalleryImageAction] ${error.message}`);

  const storageObject = getStorageObjectFromPublicUrl(imageUrl, talent.id);

  if (storageObject) {
    const { error: removeStorageError } = await supabase.storage
      .from(storageObject.bucket)
      .remove([storageObject.path]);

    if (removeStorageError) {
      throw new Error(
        `[removeOwnGalleryImageAction:storage] ${removeStorageError.message}`
      );
    }
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/gallery");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/talent-dashboard/gallery?updated=1");
}

export async function setOwnMainImageAction(formData: FormData) {
  const imageUrl = getString(formData, "image_url");

  if (!imageUrl) throw new Error("Image URL is required.");

  const { supabase, talent } = await getOwnTalent();

  const { error } = await supabase
    .from("talents")
    .update({ image_url: imageUrl })
    .eq("id", talent.id);

  if (error) throw new Error(`[setOwnMainImageAction] ${error.message}`);

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/gallery");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/talent-dashboard/gallery?updated=1");
}

export async function reorderOwnGalleryImagesAction(formData: FormData) {
  const orderedImagesRaw = getString(formData, "ordered_images");

  if (!orderedImagesRaw) {
    throw new Error("Ordered images are required.");
  }

  let orderedImages: string[];

  try {
    const parsed = JSON.parse(orderedImagesRaw);
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid ordered images payload.");
    }

    orderedImages = parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    );
  } catch {
    throw new Error("Invalid ordered images payload.");
  }

  const { supabase, talent } = await getOwnTalent();
  const gallery = normalizeGallery(talent.gallery_images);

  const allowedImages = new Set(
    [talent.image_url, ...gallery].filter(Boolean) as string[]
  );

  const safeOrderedImages = orderedImages.filter((imageUrl) =>
    allowedImages.has(imageUrl)
  );

  const missingImages = gallery.filter(
    (imageUrl) => !safeOrderedImages.includes(imageUrl)
  );

  const nextGallery = Array.from(
    new Set([...safeOrderedImages, ...missingImages])
  );

  const { error } = await supabase
    .from("talents")
    .update({
      gallery_images: nextGallery,
      image_url: safeOrderedImages[0] ?? talent.image_url,
    })
    .eq("id", talent.id);

  if (error) {
    throw new Error(`[reorderOwnGalleryImagesAction] ${error.message}`);
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/gallery");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/talent-dashboard/gallery?updated=1");
}