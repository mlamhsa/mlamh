"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidLocale, type Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "publisher-assets";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_PUBLISHER_TYPES = new Set([
  "individual",
  "salon",
  "store",
  "agency",
  "production_company",
  "brand",
  "photographer",
  "marketer",
  "other",
]);

function value(formData: FormData, key: string) {
  const item = formData.get(key);

  return typeof item === "string" ? item.trim() : "";
}

function numberValue(formData: FormData, key: string) {
  const raw = value(formData, key);

  if (!raw) {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) ? parsed : null;
}

function getLocale(formData: FormData): Locale {
  const locale = value(formData, "locale");

  return isValidLocale(locale) ? locale : "ar";
}

function getPublisherType(formData: FormData) {
  const publisherType = value(formData, "publisher_type");

  if (!ALLOWED_PUBLISHER_TYPES.has(publisherType)) {
    throw new Error("Invalid publisher type.");
  }

  return publisherType;
}

function getImageFile(formData: FormData, key: string) {
  const item = formData.get(key);

  if (!(item instanceof File) || item.size === 0) {
    return null;
  }

  if (!ALLOWED_IMAGE_TYPES.has(item.type)) {
    throw new Error(
      "Only JPEG, PNG, and WebP images are allowed.",
    );
  }

  if (item.size > MAX_IMAGE_SIZE) {
    throw new Error(
      "Image size must not exceed 5 MB.",
    );
  }

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
  const extension = IMAGE_EXTENSIONS[file.type];

  if (!extension) {
    throw new Error("Unsupported image type.");
  }

  const filePath =
    `publishers/${publisherId}/` +
    `${folder}-${Date.now()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = adminClient.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function updatePublisherProfileAction(
  formData: FormData,
) {
  const locale = getLocale(formData);

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/publisher-login`);
  }

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.account_type !== "publisher"
  ) {
    throw new Error("Publisher profile not found.");
  }

  const { data: publisher, error: publisherError } =
    await adminClient
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
  const publisherType = getPublisherType(formData);

  const profileImage = getImageFile(
    formData,
    "profile_image",
  );

  const coverImage = getImageFile(
    formData,
    "cover_image",
  );

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

  const { error: profileUpdateError } =
    await adminClient
      .from("profiles")
      .update({
        display_name: companyName || contactName || null,
        phone: phone || null,
      })
      .eq("id", profile.id)
      .eq("user_id", user.id);

  if (profileUpdateError) {
    throw new Error(profileUpdateError.message);
  }

  const publisherUpdateData: Record<
    string,
    string | number | null
  > = {
    company_name: companyName || null,
    contact_name: contactName || null,
    publisher_type: publisherType,
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

  if (profileImageUrl) {
    publisherUpdateData.profile_image_url =
      profileImageUrl;
  }

  if (coverImageUrl) {
    publisherUpdateData.cover_image_url =
      coverImageUrl;
  }

  const { data: updatedPublisher, error: publisherUpdateError } =
    await adminClient
      .from("publishers")
      .update(publisherUpdateData)
      .eq("id", publisher.id)
      .eq("profile_id", profile.id)
      .select("id")
      .maybeSingle();

  if (publisherUpdateError) {
    throw new Error(publisherUpdateError.message);
  }

  if (!updatedPublisher) {
    throw new Error("Publisher profile could not be updated.");
  }

  revalidatePath(`/${locale}/publisher-dashboard`);
  revalidatePath(
    `/${locale}/publisher-dashboard/profile`,
  );
  revalidatePath(
    `/${locale}/publisher-dashboard/settings`,
  );

  redirect(
    `/${locale}/publisher-dashboard/profile?saved=1`,
  );
}