"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CLEAN_MEDIA_BUCKET = "talent-media";
const LEGACY_GALLERY_BUCKET = "talent-gallery";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_DIMENSION = 12_000;

type DetectedImage = "jpeg" | "png" | "webp";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getLocale(formData: FormData) {
  return getString(formData, "locale") === "en" ? "en" : "ar";
}

function detectImageType(bytes: Uint8Array): DetectedImage | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

function declaredTypeMatches(fileType: string, detectedType: DetectedImage) {
  if (detectedType === "jpeg") return fileType === "image/jpeg";
  if (detectedType === "png") return fileType === "image/png";
  return fileType === "image/webp";
}

function getOwnedPreviousObject(imageUrl: string | null, userId: string, talentId: string) {
  if (!imageUrl) return null;
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
      bucket === CLEAN_MEDIA_BUCKET &&
      path.startsWith(`${userId}/profile-images/`) &&
      /^[0-9a-f-]{36}\/profile-images\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(path)
    ) {
      return { bucket, path };
    }

    if (
      bucket === LEGACY_GALLERY_BUCKET &&
      (path.startsWith(`${talentId}/profile-`) || path.startsWith(`talents/${talentId}/profile-`))
    ) {
      return { bucket, path };
    }

    return null;
  } catch {
    return null;
  }
}

export async function updateOwnTalentMainImageAction(formData: FormData): Promise<void> {
  const locale = getLocale(formData);
  const file = formData.get("profile_image");
  const returnTo = getString(formData, "return_to");
  const returnPath =
    returnTo === "profile"
      ? `/${locale}/talent-dashboard/profile?profileImageUpdated=1`
      : `/${locale}/talent-dashboard?profileImageUpdated=1`;

  if (!(file instanceof File) || file.size === 0) {
    throw new Error(locale === "ar" ? "يرجى اختيار صورة." : "Please select an image.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      locale === "ar"
        ? "يجب ألا يتجاوز حجم الصورة 5 ميجابايت."
        : "Image size must not exceed 5MB.",
    );
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error(
      locale === "ar"
        ? "الصيغ المدعومة: JPG وPNG وWEBP."
        : "Supported formats: JPG, PNG, and WEBP.",
    );
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(input);

  if (!detectedType || !declaredTypeMatches(file.type, detectedType)) {
    throw new Error(
      locale === "ar"
        ? "تعذر التحقق من نوع الصورة. استخدم صورة JPG أو PNG أو WEBP سليمة."
        : "The image type could not be verified. Use a valid JPG, PNG, or WEBP image.",
    );
  }

  let metadata: { width?: number; height?: number };
  try {
    metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      sequentialRead: true,
    }).metadata();
  } catch {
    throw new Error(
      locale === "ar"
        ? "ملف الصورة غير صالح أو تالف."
        : "The image file is invalid or corrupted.",
    );
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (
    width <= 0 ||
    height <= 0 ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION ||
    width * height > MAX_INPUT_PIXELS
  ) {
    throw new Error(
      locale === "ar"
        ? "أبعاد الصورة غير مدعومة."
        : "The image dimensions are not supported.",
    );
  }

  const pipeline = sharp(input, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    sequentialRead: true,
  }).rotate();

  let output: Buffer;
  let extension: "jpg" | "png" | "webp";
  let contentType: "image/jpeg" | "image/png" | "image/webp";

  if (detectedType === "jpeg") {
    output = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    extension = "jpg";
    contentType = "image/jpeg";
  } else if (detectedType === "png") {
    output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    extension = "png";
    contentType = "image/png";
  } else {
    output = await pipeline.webp({ quality: 90 }).toBuffer();
    extension = "webp";
    contentType = "image/webp";
  }

  if (output.length <= 0 || output.length > MAX_IMAGE_SIZE) {
    throw new Error(
      locale === "ar"
        ? "تعذر إنشاء نسخة آمنة من الصورة ضمن الحجم المسموح."
        : "A safe copy of the image could not be created within the allowed size.",
    );
  }

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) redirect(`/${locale}/login`);

  const supabase = createAdminClient();
  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id,slug,image_url")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[updateOwnTalentMainImageAction:talent] ${talentError.message}`);
  }
  if (!talent) redirect(`/${locale}/talent-dashboard/profile`);

  const filePath = `${user.id}/profile-images/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(CLEAN_MEDIA_BUCKET)
    .upload(filePath, output, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`[updateOwnTalentMainImageAction:upload] ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CLEAN_MEDIA_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    await supabase.storage.from(CLEAN_MEDIA_BUCKET).remove([filePath]);
    throw new Error("Failed to generate public image URL.");
  }

  const { error: updateError } = await supabase
    .from("talents")
    .update({ image_url: publicUrl })
    .eq("id", talent.id)
    .eq("user_id", user.id);

  if (updateError) {
    await supabase.storage.from(CLEAN_MEDIA_BUCKET).remove([filePath]);
    throw new Error(`[updateOwnTalentMainImageAction:update] ${updateError.message}`);
  }

  const previousObject = getOwnedPreviousObject(
    typeof talent.image_url === "string" ? talent.image_url : null,
    user.id,
    String(talent.id),
  );

  if (previousObject) {
    const { error: cleanupError } = await supabase.storage
      .from(previousObject.bucket)
      .remove([previousObject.path]);
    if (cleanupError) {
      console.error("[updateOwnTalentMainImageAction:cleanup]", cleanupError.message);
    }
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath(`/${locale}/talent-dashboard/gallery`);

  if (talent.slug) {
    revalidatePath(`/${locale}/talent/${encodeURIComponent(talent.slug)}`);
  }

  redirect(returnPath);
}
