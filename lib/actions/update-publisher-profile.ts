"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "publisher-assets";

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function numberValue(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFile(formData: FormData, key: string) {
  const item = formData.get(key);
  if (!(item instanceof File)) return null;
  if (item.size === 0) return null;
  return item;
}

async function uploadPublisherImage({
  adminClient,
  publisherId,
  file,
  folder,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
  publisherId: number | string;
  file: File;
  folder: "profile" | "cover";
}) {
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `publishers/${publisherId}/${folder}-${Date.now()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = adminClient.storage.from(BUCKET).getPublicUrl(filePath);

  return data.publicUrl;
}

export async function updatePublisherProfileAction(formData: FormData) {
  const locale = value(formData, "locale") || "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/publisher-login`);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  const { data: publisher, error: publisherError } = await adminClient
    .from("publishers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error("Publisher account not found.");
  }

  const companyName = value(formData, "company_name");
  const contactName = value(formData, "contact_name");
  const phone = value(formData, "phone");

  const profileImage = getFile(formData, "profile_image");
  const coverImage = getFile(formData, "cover_image");

  let profileImageUrl: string | null = null;
  let coverImageUrl: string | null = null;

  if (profileImage) {
    profileImageUrl = await uploadPublisherImage({
      adminClient,
      publisherId: publisher.id,
      file: profileImage,
      folder: "profile",
    });
  }

  if (coverImage) {
    coverImageUrl = await uploadPublisherImage({
      adminClient,
      publisherId: publisher.id,
      file: coverImage,
      folder: "cover",
    });
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      phone: phone || null,
    })
    .eq("id", profile.id);

  if (profileUpdateError) {
    throw new Error(profileUpdateError.message);
  }

  const publisherUpdateData: Record<string, string | number | null> = {
    company_name: companyName || null,
    contact_name: contactName || null,
    publisher_type: value(formData, "publisher_type") || null,
    city: value(formData, "city") || null,
    company_size: value(formData, "company_size") || null,
    founded_year: numberValue(formData, "founded_year"),
    description: value(formData, "description") || null,
    phone: phone || null,
    email: value(formData, "email") || null,
    website: value(formData, "website") || null,
    address: value(formData, "address") || null,
    instagram: value(formData, "instagram") || null,
    tiktok_url: value(formData, "tiktok_url") || null,
    snapchat_url: value(formData, "snapchat_url") || null,
    linkedin_url: value(formData, "linkedin_url") || null,
  };

  if (profileImageUrl) publisherUpdateData.profile_image_url = profileImageUrl;
  if (coverImageUrl) publisherUpdateData.cover_image_url = coverImageUrl;

  const { error: publisherUpdateError } = await adminClient
    .from("publishers")
    .update(publisherUpdateData)
    .eq("id", publisher.id);

  if (publisherUpdateError) {
    throw new Error(publisherUpdateError.message);
  }

  // إعادة التحقق من المسارات
  revalidatePath(`/${locale}/publisher-dashboard`);
  revalidatePath(`/${locale}/publisher-dashboard/profile`);
  revalidatePath(`/${locale}/publisher-dashboard/settings`);

  // إعادة التوجيه مع رسالة نجاح
  redirect(`/${locale}/publisher-dashboard/profile?saved=1`);
}