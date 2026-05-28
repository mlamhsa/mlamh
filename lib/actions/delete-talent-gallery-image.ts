"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

const BUCKET_NAME = "talent-images";

async function requireAdminUser() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const adminClient = createAdminClient();

  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError || !adminUser) {
    throw new Error("Forbidden");
  }
}

function extractStoragePathFromPublicUrl(
  publicUrl: string
): string | null {
  try {
    const url = new URL(publicUrl);

    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;

    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.slice(index + marker.length)
    );
  } catch {
    return null;
  }
}

export async function deleteTalentGalleryImageAction(
  formData: FormData
): Promise<void> {
  await requireAdminUser();

  const talentId = Number(formData.get("talentId"));

  const imageUrl = String(
    formData.get("imageUrl") ?? ""
  );

  if (
    !Number.isFinite(talentId) ||
    talentId <= 0
  ) {
    throw new Error("Invalid talent id");
  }

  if (!imageUrl) {
    throw new Error("Invalid image url");
  }

  const supabase = createAdminClient();

  const { data: talent, error: fetchError } =
    await supabase
      .from("talents")
      .select("image_url, gallery_images, slug")
      .eq("id", talentId)
      .maybeSingle();

  if (fetchError) {
    throw new Error(
      `[deleteTalentGalleryImageAction] ${fetchError.message}`
    );
  }

  if (!talent) {
    throw new Error("Talent not found");
  }

  if (talent.image_url === imageUrl) {
    throw new Error(
      "Main image cannot be deleted from gallery manager."
    );
  }

  const currentGallery = normalizeGalleryImages(
    talent.gallery_images
  );

  const nextGallery = currentGallery.filter(
    (url) => url !== imageUrl
  );

  const { error: updateError } = await supabase
    .from("talents")
    .update({
      gallery_images: nextGallery,
    })
    .eq("id", talentId);

  if (updateError) {
    throw new Error(
      `[deleteTalentGalleryImageAction] ${updateError.message}`
    );
  }

  const storagePath =
    extractStoragePathFromPublicUrl(imageUrl);

  if (storagePath) {
    const { error: storageError } =
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

    if (storageError) {
      console.error(
        "[deleteTalentGalleryImageAction] Storage delete failed:",
        storageError.message
      );
    }
  }

  revalidatePath("/admin");

  revalidatePath(
    `/admin/talents/${talentId}/edit`
  );

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect(
    `/admin/talents/${talentId}/edit?updated=1`
  );
}