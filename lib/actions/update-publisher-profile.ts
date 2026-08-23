"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidLocale, type Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "publisher-assets";

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_COVER_IMAGE_SIZE = 10 * 1024 * 1024;

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
  "production_company",
  "advertising_agency",
  "casting_agency",
  "talent_agency",
  "brand",
  "content_company",
  "individual",
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

function getImageFile(
  formData: FormData,
  key: string,
  maxSize: number,
  label: "profile" | "cover",
) {
  const item = formData.get(key);

  if (!(item instanceof File) || item.size === 0) {
    return null;
  }

  if (!ALLOWED_IMAGE_TYPES.has(item.type)) {
    throw new Error(
      "Only JPEG, PNG, and WebP images are allowed.",
    );
  }

  if (item.size > maxSize) {
    throw new Error(
      label === "cover"
        ? "Cover image size must not exceed 10 MB."
        : "Profile image size must not exceed 5 MB.",
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

async function savePublisherProfile(
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
    redirect(`/${locale}/login`);
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
  const isIndividual =
  publisherType === "individual";

  const profileImage = getImageFile(
    formData,
    "profile_image",
    MAX_PROFILE_IMAGE_SIZE,
    "profile",
  );

  const coverImage = getImageFile(
    formData,
    "cover_image",
    MAX_COVER_IMAGE_SIZE,
    "cover",
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
  display_name: isIndividual
    ? contactName || null
    : companyName || null,
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
  description: value(formData, "description") || null,
  phone: phone || null,
  email: value(formData, "email") || null,
  website: value(formData, "website") || null,
  instagram: value(formData, "instagram") || null,
  tiktok_url: value(formData, "tiktok_url") || null,
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
    throw new Error(
      "Publisher profile could not be updated.",
    );
  }

  revalidatePath(`/${locale}/publisher-dashboard`);

  revalidatePath(
    `/${locale}/publisher-dashboard/profile`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/settings`,
  );

  return {
    locale,
  };
}

export async function updatePublisherProfileAction(
  formData: FormData,
): Promise<void> {
  const { locale } =
    await savePublisherProfile(formData);

  redirect(
    `/${locale}/publisher-dashboard/profile?saved=1`,
  );
}

export async function autoSavePublisherProfileAction(
  formData: FormData,
) {
  await savePublisherProfile(formData);

  return {
    success: true as const,
  };
}
export async function submitPublisherProfileForReviewAction(
  formData: FormData,
): Promise<void> {
  const { locale } =
    await savePublisherProfile(formData);

  const authClient =
    await createServerSupabaseClient();

  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const {
    data: profile,
    error: profileError,
  } = await adminClient
    .from("profiles")
    .select("id, approval_status")
    .eq("user_id", user.id)
    .eq("account_type", "publisher")
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(
      "Publisher profile not found."
    );
  }

  const {
    data: publisher,
    error: publisherError,
  } = await adminClient
  .from("publishers")
  .select(`
    id,
    company_name,
    contact_name,
    publisher_type,
    city,
    description,
    profile_image_url
  `)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError || !publisher) {
    throw new Error(
      "Publisher account not found."
    );
  }

  const isIndividual =
  publisher.publisher_type === "individual";

const missingRequiredFields = [
  !isIndividual && !publisher.company_name
    ? locale === "ar"
      ? "اسم الجهة"
      : "Company name"
    : null,

  !publisher.contact_name
    ? locale === "ar"
      ? isIndividual
        ? "الاسم المهني"
        : "اسم المسؤول"
      : isIndividual
        ? "Professional name"
        : "Contact name"
    : null,

  !publisher.publisher_type
    ? locale === "ar"
      ? "نوع الحساب"
      : "Account type"
    : null,

  !publisher.city
    ? locale === "ar"
      ? "المدينة"
      : "City"
    : null,
    !isIndividual && !publisher.profile_image_url
    ? locale === "ar"
      ? "شعار الجهة"
      : "Organization logo"
    : null,
    
].filter(Boolean);
if (missingRequiredFields.length > 0) {
  const missing = encodeURIComponent(
    missingRequiredFields.join(",")
  );

  redirect(
    `/${locale}/publisher-dashboard/profile?error=incomplete&missing=${missing}`
  );
}

  const { error: approvalError } =
    await adminClient
      .from("profiles")
      .update({
        approval_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .eq("user_id", user.id);

  if (approvalError) {
    throw new Error(
      `[submitPublisherProfileForReviewAction] ${approvalError.message}`
    );
  }

  revalidatePath(
    `/${locale}/publisher-dashboard`
  );

  revalidatePath(
    `/${locale}/publisher-dashboard/profile`
  );

  revalidatePath("/admin/publishers");

  redirect(
    `/${locale}/publisher-dashboard/profile?submitted=1`
  );
}