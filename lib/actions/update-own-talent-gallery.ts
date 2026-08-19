"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const GALLERY_BUCKET = "talent-gallery";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 20;

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0,
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return normalizeGallery(parsed);
      }
    } catch {
      return value.trim()
        ? [value.trim()]
        : [];
    }
  }

  return [];
}

function getString(
  formData: FormData,
  key: string,
) {
  const value =
    formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function getLocale(
  formData: FormData,
) {
  const locale =
    getString(
      formData,
      "locale",
    );

  return locale === "en"
    ? "en"
    : "ar";
}

function getImageExtension(
  file: File,
) {
  const extensionFromName =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extensionFromName &&
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ].includes(
      extensionFromName,
    )
  ) {
    return extensionFromName;
  }

  if (
    file.type === "image/jpeg"
  ) {
    return "jpg";
  }

  if (
    file.type === "image/png"
  ) {
    return "png";
  }

  if (
    file.type === "image/webp"
  ) {
    return "webp";
  }

  return null;
}

function validateImageFile(
  file: File,
) {
  if (
    file.size === 0
  ) {
    throw new Error(
      `The selected file "${file.name}" is empty.`,
    );
  }

  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    throw new Error(
      `The file "${file.name}" is not an image.`,
    );
  }

  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {
    throw new Error(
      `The image "${file.name}" must be 10MB or less.`,
    );
  }

  const extension =
    getImageExtension(
      file,
    );

  if (
    !extension
  ) {
    throw new Error(
      `The image "${file.name}" must be JPG, JPEG, PNG, or WEBP.`,
    );
  }

  return extension;
}

function getStorageObjectFromPublicUrl(
  imageUrl: string,
  talentId: string,
) {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    const url =
      new URL(
        imageUrl,
      );

    const projectUrl =
      new URL(
        supabaseUrl,
      );

    if (
      url.hostname !==
      projectUrl.hostname
    ) {
      return null;
    }

    const marker =
      "/storage/v1/object/public/";

    const markerIndex =
      url.pathname.indexOf(
        marker,
      );

    if (
      markerIndex === -1
    ) {
      return null;
    }

    const objectPart =
      decodeURIComponent(
        url.pathname.slice(
          markerIndex +
            marker.length,
        ),
      );

    const [
      bucket,
      ...pathParts
    ] =
      objectPart.split(
        "/",
      );

    const path =
      pathParts.join(
        "/",
      );

    if (
      !bucket ||
      !path
    ) {
      return null;
    }

    /*
     * مهم:
     * هذه الـ Action خاصة بمعرض الأعمال فقط.
     * لا نسمح لها بحذف أي ملف من bucket الصور الشخصية.
     */
    if (
      bucket !==
      GALLERY_BUCKET
    ) {
      return null;
    }

    const belongsToTalent =
      path.startsWith(
        `${talentId}/`,
      ) ||
      path.startsWith(
        `talents/${talentId}/`,
      );

    if (
      !belongsToTalent
    ) {
      return null;
    }

    return {
      bucket,
      path,
    };
  } catch {
    return null;
  }
}

async function getOwnTalent(
  locale: string,
) {
  const authClient =
    await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } =
    await authClient.auth.getUser();

  if (
    error ||
    !user
  ) {
    redirect(
      `/${locale}/login`,
    );
  }

  const supabase =
    createAdminClient();

  const {
    data: talent,
    error: talentError,
  } =
    await supabase
      .from(
        "talents",
      )
      .select(
        `
          id,
          slug,
          image_url,
          gallery_images
        `,
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

  if (
    talentError
  ) {
    throw new Error(
      `[getOwnTalent] ${talentError.message}`,
    );
  }

  if (
    !talent
  ) {
    redirect(
      `/${locale}/talent-dashboard/profile`,
    );
  }

  return {
    supabase,
    talent,
  };
}

function revalidateGalleryPages(
  locale: string,
  talentSlug?: string | null,
) {
  revalidatePath(
    `/${locale}/talent-dashboard`,
  );

  revalidatePath(
    `/${locale}/talent-dashboard/gallery`,
  );

  if (
    talentSlug
  ) {
    const encodedTalentSlug =
      encodeURIComponent(
        talentSlug,
      );

    revalidatePath(
      `/ar/talent/${encodedTalentSlug}`,
    );

    revalidatePath(
      `/en/talent/${encodedTalentSlug}`,
    );
  }
}

function redirectToGallery(
  locale: string,
) {
  redirect(
    `/${locale}/talent-dashboard/gallery?updated=1`,
  );
}

export async function addOwnGalleryImageAction(
  formData: FormData,
) {
  const locale =
    getLocale(
      formData,
    );

  const files =
    formData
      .getAll(
        "image_file",
      )
      .filter(
        (
          value,
        ): value is File =>
          value instanceof
            File &&
          value.size > 0,
      );

  if (
    files.length === 0
  ) {
    throw new Error(
      "At least one image file is required.",
    );
  }

  const {
    supabase,
    talent,
  } =
    await getOwnTalent(
      locale,
    );

  const gallery =
    normalizeGallery(
      talent.gallery_images,
    );

  /*
   * المعرض مستقل تمامًا عن image_url.
   * الصورة الشخصية لا تدخل في حساب سعة المعرض.
   */
  const currentImages =
    Array.from(
      new Set(
        gallery,
      ),
    );

  const remainingSlots =
    MAX_GALLERY_IMAGES -
    currentImages.length;

  if (
    remainingSlots <= 0
  ) {
    throw new Error(
      "The gallery has reached the maximum of 20 images.",
    );
  }

  if (
    files.length >
    remainingSlots
  ) {
    throw new Error(
      `You can upload only ${remainingSlots} more ${
        remainingSlots === 1
          ? "image"
          : "images"
      }.`,
    );
  }

  const validatedFiles =
    files.map(
      (file) => ({
        file,
        extension:
          validateImageFile(
            file,
          ),
      }),
    );

  const uploadedObjects:
    Array<{
      path: string;
      publicUrl: string;
    }> = [];

  try {
    for (
      const {
        file,
        extension,
      } of validatedFiles
    ) {
      const filePath =
        `${talent.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            GALLERY_BUCKET,
          )
          .upload(
            filePath,
            file,
            {
              contentType:
                file.type,
              cacheControl:
                "3600",
              upsert:
                false,
            },
          );

      if (
        uploadError
      ) {
        throw new Error(
          `[addOwnGalleryImageAction:upload:${file.name}] ${uploadError.message}`,
        );
      }

      const {
        data: {
          publicUrl,
        },
      } =
        supabase.storage
          .from(
            GALLERY_BUCKET,
          )
          .getPublicUrl(
            filePath,
          );

      if (
        !publicUrl
      ) {
        throw new Error(
          `[addOwnGalleryImageAction:public-url:${file.name}] Failed to generate public URL.`,
        );
      }

      uploadedObjects.push({
        path:
          filePath,
        publicUrl,
      });
    }

    const uploadedUrls =
      uploadedObjects.map(
        (
          item,
        ) =>
          item.publicUrl,
      );

    const nextGallery =
      Array.from(
        new Set([
          ...gallery,
          ...uploadedUrls,
        ]),
      );

    /*
     * لا نلمس image_url نهائيًا.
     * image_url = الصورة الشخصية فقط.
     */
    const {
      error:
        updateError,
    } =
      await supabase
        .from(
          "talents",
        )
        .update({
          gallery_images:
            nextGallery,
        })
        .eq(
          "id",
          talent.id,
        );

    if (
      updateError
    ) {
      throw new Error(
        `[addOwnGalleryImageAction:update] ${updateError.message}`,
      );
    }
  } catch (
    error
  ) {
    if (
      uploadedObjects.length >
      0
    ) {
      const uploadedPaths =
        uploadedObjects.map(
          (
            item,
          ) =>
            item.path,
        );

      const {
        error:
          cleanupError,
      } =
        await supabase.storage
          .from(
            GALLERY_BUCKET,
          )
          .remove(
            uploadedPaths,
          );

      if (
        cleanupError
      ) {
        console.error(
          "[addOwnGalleryImageAction:cleanup]",
          cleanupError.message,
        );
      }
    }

    throw error;
  }

  revalidateGalleryPages(
    locale,
    talent.slug,
  );

  redirectToGallery(
    locale,
  );
}

export async function removeOwnGalleryImageAction(
  formData: FormData,
) {
  const locale =
    getLocale(
      formData,
    );

  const imageUrl =
    getString(
      formData,
      "image_url",
    );

  if (
    !imageUrl
  ) {
    throw new Error(
      "Image URL is required.",
    );
  }

  const {
    supabase,
    talent,
  } =
    await getOwnTalent(
      locale,
    );

  const gallery =
    normalizeGallery(
      talent.gallery_images,
    );

  /*
   * لا يمكن حذف صورة إلا إذا كانت داخل gallery_images.
   * الصورة الشخصية ليست جزءًا من المعرض.
   */
  if (
    !gallery.includes(
      imageUrl,
    )
  ) {
    throw new Error(
      "The selected image does not belong to this gallery.",
    );
  }

  const nextGallery =
    gallery.filter(
      (
        item,
      ) =>
        item !==
        imageUrl,
    );

  const {
    error:
      updateError,
  } =
    await supabase
      .from(
        "talents",
      )
      .update({
        gallery_images:
          nextGallery,
      })
      .eq(
        "id",
        talent.id,
      );

  if (
    updateError
  ) {
    throw new Error(
      `[removeOwnGalleryImageAction:update] ${updateError.message}`,
    );
  }

  const storageObject =
    getStorageObjectFromPublicUrl(
      imageUrl,
      String(
        talent.id,
      ),
    );

  if (
    storageObject
  ) {
    const {
      error:
        removeStorageError,
    } =
      await supabase.storage
        .from(
          storageObject.bucket,
        )
        .remove([
          storageObject.path,
        ]);

    if (
      removeStorageError
    ) {
      console.error(
        "[removeOwnGalleryImageAction:storage]",
        removeStorageError.message,
      );
    }
  }

  revalidateGalleryPages(
    locale,
    talent.slug,
  );

  redirectToGallery(
    locale,
  );
}

/*
 * أبقينا الاسم مؤقتًا حتى لا ينكسر أي import قديم.
 * لكنه لم يعد يغيّر image_url.
 *
 * بعد تعديل صفحة المعرض سنحذف استخدامه من الواجهة.
 */
export async function setOwnMainImageAction(
  formData: FormData,
) {
  const locale =
    getLocale(
      formData,
    );

  const imageUrl =
    getString(
      formData,
      "image_url",
    );

  if (
    !imageUrl
  ) {
    throw new Error(
      "Image URL is required.",
    );
  }

  const {
    talent,
  } =
    await getOwnTalent(
      locale,
    );

  const gallery =
    normalizeGallery(
      talent.gallery_images,
    );

  if (
    !gallery.includes(
      imageUrl,
    )
  ) {
    throw new Error(
      "The selected image does not belong to this gallery.",
    );
  }

  /*
   * لا يوجد Main Image للمعرض بعد الآن.
   * نعيد المستخدم فقط للمعرض بدون تعديل الصورة الشخصية.
   */
  revalidateGalleryPages(
    locale,
    talent.slug,
  );

  redirectToGallery(
    locale,
  );
}

export async function reorderOwnGalleryImagesAction(
  formData: FormData,
) {
  const locale =
    getLocale(
      formData,
    );

  const orderedImagesRaw =
    getString(
      formData,
      "ordered_images",
    );

  if (
    !orderedImagesRaw
  ) {
    throw new Error(
      "Ordered images are required.",
    );
  }

  let orderedImages:
    string[];

  try {
    const parsed =
      JSON.parse(
        orderedImagesRaw,
      );

    if (
      !Array.isArray(
        parsed,
      )
    ) {
      throw new Error(
        "Invalid ordered images payload.",
      );
    }

    orderedImages =
      parsed.filter(
        (
          item,
        ): item is string =>
          typeof item ===
            "string" &&
          item.trim()
            .length > 0,
      );
  } catch {
    throw new Error(
      "Invalid ordered images payload.",
    );
  }

  const {
    supabase,
    talent,
  } =
    await getOwnTalent(
      locale,
    );

  const gallery =
    normalizeGallery(
      talent.gallery_images,
    );

  const allowedImages =
    new Set(
      gallery,
    );

  /*
   * الترتيب يسمح فقط بصور gallery_images.
   */
  const safeOrderedImages =
    orderedImages.filter(
      (
        imageUrl,
      ) =>
        allowedImages.has(
          imageUrl,
        ),
    );

  const missingImages =
    gallery.filter(
      (
        imageUrl,
      ) =>
        !safeOrderedImages.includes(
          imageUrl,
        ),
    );

  const nextGallery =
    Array.from(
      new Set([
        ...safeOrderedImages,
        ...missingImages,
      ]),
    );

  /*
   * مهم:
   * لا يوجد أي تحديث لـ image_url هنا.
   */
  const {
    error,
  } =
    await supabase
      .from(
        "talents",
      )
      .update({
        gallery_images:
          nextGallery,
      })
      .eq(
        "id",
        talent.id,
      );

  if (
    error
  ) {
    throw new Error(
      `[reorderOwnGalleryImagesAction] ${error.message}`,
    );
  }

  revalidateGalleryPages(
    locale,
    talent.slug,
  );

  redirectToGallery(
    locale,
  );
}