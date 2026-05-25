import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadTalentImage(
  file: File,
) {
  const supabase = createAdminClient();

  const fileExt = file.name.split(".").pop();

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const filePath = `talents/${fileName}`;

  const { error } = await supabase.storage
    .from("talent-images")
    .upload(filePath, file, {
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("talent-images")
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadGalleryImages(
  files: File[],
) {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const imageUrl = await uploadTalentImage(file);

    uploadedUrls.push(imageUrl);
  }

  return uploadedUrls;
}