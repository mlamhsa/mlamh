"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
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
  const imageUrl = getString(formData, "image_url");

  if (!imageUrl) throw new Error("Image URL is required.");

  const { supabase, talent } = await getOwnTalent();
  const gallery = normalizeGallery(talent.gallery_images);

  const nextGallery = Array.from(new Set([...gallery, imageUrl]));

  const { error } = await supabase
    .from("talents")
    .update({
      gallery_images: nextGallery,
      image_url: talent.image_url || imageUrl,
    })
    .eq("id", talent.id);

  if (error) throw new Error(`[addOwnGalleryImageAction] ${error.message}`);

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/gallery");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/talent-dashboard/gallery?updated=1");
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
      image_url: talent.image_url === imageUrl ? nextGallery[0] ?? null : talent.image_url,
    })
    .eq("id", talent.id);

  if (error) throw new Error(`[removeOwnGalleryImageAction] ${error.message}`);

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/gallery");

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

  redirect("/talent-dashboard/gallery?updated=1");
}