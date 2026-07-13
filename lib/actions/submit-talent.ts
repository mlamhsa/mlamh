"use server";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

import {
  getValidationMessages,
  hasValidationErrors,
  parseTalentSubmissionForm,
  validateTalentSubmission,
  type TalentSubmissionErrors,
} from "@/lib/validations/talent-submission";

const PENDING_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80";

const TALENT_IMAGES_BUCKET = "talent-images";
const MAX_IMAGE_SIZE_MB = 15;
const MAX_GALLERY_IMAGES = 1;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type SubmitTalentState = {
  success: boolean;
  errors: TalentSubmissionErrors;
  message: string | null;
};

const initialErrors: TalentSubmissionErrors = {};

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getFileValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getFileArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0
    );
}

function getImageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/avif") return "avif";

  return null;
}

function createTalentSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "");

  return `${base || "talent"}-${userId.slice(0, 8)}`;
}

async function uploadTalentImage({
  adminClient,
  file,
  userId,
  folder,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
  file: File;
  userId: string;
  folder: "profile-images" | "gallery";
}) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      "Only JPG, PNG, WEBP, and AVIF images are allowed."
    );
  }

  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(
      `Image size exceeds the ${MAX_IMAGE_SIZE_MB}MB limit.`
    );
  }

  const extension = getImageExtension(file.type);

  if (!extension) {
    throw new Error("Unsupported image type.");
  }

  const filePath =
    `${folder}/${userId}/${Date.now()}-${randomUUID()}.${extension}`;

  const fileBuffer = new Uint8Array(
    await file.arrayBuffer()
  );

  const { error: uploadError } = await adminClient.storage
    .from(TALENT_IMAGES_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `[submitTalentAction imageUpload] ${uploadError.message}`
    );
  }

  const {
    data: { publicUrl },
  } = adminClient.storage
    .from(TALENT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function submitTalentAction(
  _prevState: SubmitTalentState,
  formData: FormData
): Promise<SubmitTalentState> {
  const localeParam = formData.get("locale");

  const locale =
    typeof localeParam === "string" && isValidLocale(localeParam)
      ? (localeParam as Locale)
      : "ar";

  const errorMessages = {
    generic:
      locale === "ar"
        ? "تعذر حفظ البيانات. حاول مرة أخرى."
        : "Unable to save your profile. Please try again.",

    auth:
      locale === "ar"
        ? "يرجى تسجيل الدخول أولاً."
        : "Please sign in first.",

    invalidCategory:
      locale === "ar"
        ? "يرجى اختيار فئة صحيحة."
        : "Please select a valid category.",

    invalidCity:
      locale === "ar"
        ? "يرجى اختيار مدينة صحيحة."
        : "Please select a valid city.",

    invalidImage:
      locale === "ar"
        ? `يرجى استخدام صورة بصيغة JPG أو PNG أو WEBP أو AVIF، وبحجم لا يتجاوز ${MAX_IMAGE_SIZE_MB}MB.`
        : `Please use a JPG, PNG, WEBP, or AVIF image no larger than ${MAX_IMAGE_SIZE_MB}MB.`,

    imageUpload:
      locale === "ar"
        ? "تعذر رفع الصور. حاول مرة أخرى."
        : "Unable to upload images. Please try again.",

    success:
      locale === "ar"
        ? "تم حفظ ملفك بنجاح."
        : "Your profile has been saved.",
  };

  const categorySlug = getStringValue(
    formData,
    "category_slug"
  );

  const citySlug = getStringValue(
    formData,
    "city_slug"
  );

  const selectedCategory = TALENT_CATEGORIES.find(
    (category) => category.slug === categorySlug
  );

  if (!selectedCategory) {
    return {
      success: false,
      errors: initialErrors,
      message: errorMessages.invalidCategory,
    };
  }

  const selectedCity = SAUDI_CITIES.find(
    (city) => city.slug === citySlug
  );

  if (!selectedCity) {
    return {
      success: false,
      errors: initialErrors,
      message: errorMessages.invalidCity,
    };
  }

  /*
   * نعتمد القيم الرسمية الموجودة في قوائم المشروع،
   * ولا نعتمد على قيم نصية قادمة من المتصفح.
   */
  formData.set("category_slug", selectedCategory.slug);
  formData.set("category_ar", selectedCategory.ar);
  formData.set("category_en", selectedCategory.en);

  formData.set("city_slug", selectedCity.slug);
  formData.set("city_ar", selectedCity.ar);
  formData.set("city_en", selectedCity.en);

  const data = parseTalentSubmissionForm(formData);
  const validationMessages = getValidationMessages(locale);

  const errors = validateTalentSubmission(
    data,
    validationMessages
  );

  if (hasValidationErrors(errors)) {
    return {
      success: false,
      errors,
      message: null,
    };
  }

  try {
    const authClient = await createServerSupabaseClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.auth,
      };
    }

    const profileImageFile = getFileValue(
      formData,
      "image"
    );

    const galleryFiles = getFileArray(
      formData,
      "gallery"
    ).slice(0, MAX_GALLERY_IMAGES);

    const allImageFiles = [
      ...(profileImageFile ? [profileImageFile] : []),
      ...galleryFiles,
    ];

    const invalidImageFile = allImageFiles.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type) ||
        file.size >
          MAX_IMAGE_SIZE_MB * 1024 * 1024
    );

    if (invalidImageFile) {
      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.invalidImage,
      };
    }

    let imageUrl =
      getStringValue(formData, "image_url") ||
      PENDING_IMAGE_PLACEHOLDER;

    let galleryImages = getStringArray(
      formData,
      "gallery_images"
    );

    /*
     * رفع الصور من السيرفر باستخدام Admin Client.
     * بذلك لا يخضع الرفع لسياسات RLS الخاصة بمتصفح المستخدم.
     */
    try {
      if (profileImageFile) {
        imageUrl = await uploadTalentImage({
          adminClient,
          file: profileImageFile,
          userId: user.id,
          folder: "profile-images",
        });
      }

      if (galleryFiles.length > 0) {
        const uploadedGalleryImages: string[] = [];

        for (const file of galleryFiles) {
          const uploadedUrl = await uploadTalentImage({
            adminClient,
            file,
            userId: user.id,
            folder: "gallery",
          });

          uploadedGalleryImages.push(uploadedUrl);
        }

        galleryImages = uploadedGalleryImages;
      }
    } catch (imageUploadError) {
      console.error(
        "[submitTalentAction imageUpload]",
        imageUploadError
      );

      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.imageUpload,
      };
    }

    /*
     * إنشاء أو تحديث Profile.
     */
    const {
      data: existingProfile,
      error: profileFetchError,
    } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileFetchError) {
      console.error(
        "[submitTalentAction profileFetch]",
        profileFetchError.message
      );

      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.generic,
      };
    }

    let profileId = existingProfile?.id;

    if (!profileId) {
      const {
        data: createdProfile,
        error: profileCreateError,
      } = await adminClient
        .from("profiles")
        .insert({
          user_id: user.id,
          account_type: "talent",
        })
        .select("id")
        .single();

      if (profileCreateError || !createdProfile?.id) {
        console.error(
          "[submitTalentAction profileCreate]",
          profileCreateError?.message
        );

        return {
          success: false,
          errors: initialErrors,
          message: errorMessages.generic,
        };
      }

      profileId = createdProfile.id;
    } else {
      const { error: profileUpdateError } =
        await adminClient
          .from("profiles")
          .update({
            account_type: "talent",
          })
          .eq("id", profileId)
          .eq("user_id", user.id);

      if (profileUpdateError) {
        console.error(
          "[submitTalentAction profileUpdate]",
          profileUpdateError.message
        );

        return {
          success: false,
          errors: initialErrors,
          message: errorMessages.generic,
        };
      }
    }

    const nameForSlug =
      data.name_en || data.name_ar || "talent";

    const slug = createTalentSlug(
      nameForSlug,
      user.id
    );

    /*
     * جدول talents الحالي مرتبط بالمستخدم مباشرة عن طريق user_id.
     * لا يحتوي الجدول على عمود profile_id.
     */
    const talentPayload = {
      user_id: user.id,

      name_en: data.name_en,
      name_ar: data.name_ar,

      category_slug: selectedCategory.slug,
      category_en: selectedCategory.en,
      category_ar: selectedCategory.ar,

      city_slug: selectedCity.slug,
      city_en: selectedCity.en,
      city_ar: selectedCity.ar,

      age: data.age,
      height: data.height,

      bio_en: data.bio_en,
      bio_ar: data.bio_ar,

      whatsapp: data.whatsapp,
      instagram: data.instagram,
      tiktok: data.tiktok,
      snapchat: data.snapchat,
      portfolio_url: data.portfolio_url,

      status: "pending",
      published: false,
      featured: false,

      image_url: imageUrl,
      gallery_images: galleryImages,

      slug,
    };

    /*
     * البحث باستخدام user_id لأنه المرجع الموجود فعليًا
     * داخل جدول talents.
     */
    const {
      data: existingTalent,
      error: talentByUserError,
    } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (talentByUserError) {
      console.error(
        "[submitTalentAction talentByUser]",
        talentByUserError.message
      );

      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.generic,
      };
    }

    if (existingTalent) {
      const { error: talentUpdateError } =
        await adminClient
          .from("talents")
          .update(talentPayload)
          .eq("id", existingTalent.id)
          .eq("user_id", user.id);

      if (talentUpdateError) {
        console.error(
          "[submitTalentAction talentUpdate]",
          talentUpdateError.message
        );

        return {
          success: false,
          errors: initialErrors,
          message: errorMessages.generic,
        };
      }
    } else {
      const { error: talentInsertError } =
        await adminClient
          .from("talents")
          .insert(talentPayload);

      if (talentInsertError) {
        console.error(
          "[submitTalentAction talentInsert]",
          talentInsertError
        );

        return {
          success: false,
          errors: initialErrors,
          message: errorMessages.generic,
        };
      }
    }

    return {
      success: true,
      errors: initialErrors,
      message: errorMessages.success,
    };
  } catch (error) {
    console.error("[submitTalentAction]", error);

    return {
      success: false,
      errors: initialErrors,
      message: errorMessages.generic,
    };
  }
}