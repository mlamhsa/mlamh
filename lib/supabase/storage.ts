import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "talent-images";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

function generateFileName(extension: string) {
  const random = crypto.randomUUID();

  return `${Date.now()}-${random}.${extension}`;
}

function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Unsupported image type. Allowed: JPG, PNG, WEBP, AVIF."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image size exceeds 5MB limit.");
  }
}

function getExtensionFromMimeType(type: string) {
  switch (type) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "image/avif":
      return "avif";

    default:
      throw new Error("Unsupported image type.");
  }
}

export async function uploadTalentImage(
  file: File
) {
  validateImageFile(file);

  const supabase = createAdminClient();

  const extension = getExtensionFromMimeType(
    file.type
  );

  const fileName = generateFileName(extension);

  const filePath = `talents/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(
      `[uploadTalentImage] ${error.message}`
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadGalleryImages(
  files: File[]
) {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const imageUrl = await uploadTalentImage(file);

    uploadedUrls.push(imageUrl);
  }

  return uploadedUrls;
}