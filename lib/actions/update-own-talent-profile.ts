"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_AVAILABILITY = new Set([
  "available_now",
  "available_this_week",
  "available_next_month",
  "unavailable",
]);

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requiredStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function nullableStringValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value.length > 0 ? value : null;
}

function dateValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value || null;
}

function stringArrayValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    );
  } catch {
    return [];
  }
}

function availabilityValue(formData: FormData) {
  const value = stringValue(formData, "availability_status");
  return ALLOWED_AVAILABILITY.has(value) ? value : "available_now";
}

function getSelectedCity(formData: FormData) {
  const citySlug = requiredStringValue(formData, "city_slug");

  const city = SAUDI_CITIES.find((item) => item.slug === citySlug);

  if (!city) {
    throw new Error("Invalid city selected.");
  }

  return {
    city_slug: city.slug,
    city_ar: city.ar,
    city_en: city.en,
  };
}

function getSelectedCategory(formData: FormData) {
  const categorySlug = requiredStringValue(formData, "category_slug");

  const category = TALENT_CATEGORIES.find(
    (item) => item.slug === categorySlug
  );

  if (!category) {
    throw new Error("Invalid category selected.");
  }

  return {
    category_slug: category.slug,
    category_ar: category.ar,
    category_en: category.en,
  };
}

function createDisplayName(value: string) {
  return value.trim().split(/\s+/).filter(Boolean)[0] ?? value.trim();
}

function createSlug(value: string, id: number) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base ? `${base}-${id}` : `talent-${id}`;
}

async function getCurrentUser() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/ar/talent-login");
  }

  return user;
}

export async function createOwnTalentProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  const { data: existingTalent } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingTalent) {
    redirect("/ar/talent-dashboard/profile");
  }

  const nameEn = requiredStringValue(formData, "name_en");
  const nameAr = requiredStringValue(formData, "name_ar");
  const imageUrl = requiredStringValue(formData, "image_url");
  const galleryImages = stringArrayValue(formData, "gallery_images");

  const selectedCategory = getSelectedCategory(formData);
  const selectedCity = getSelectedCity(formData);

  const nationalitySlug = nullableStringValue(
    formData,
    "nationality_slug"
  );

  const payload = {
    user_id: user.id,

    name_en: nameEn,
    name_ar: nameAr,

    display_name_en: createDisplayName(nameEn),
    display_name_ar: createDisplayName(nameAr),

    category_slug: selectedCategory.category_slug,
    category_en: selectedCategory.category_en,
    category_ar: selectedCategory.category_ar,

    city_slug: selectedCity.city_slug,
    city_en: selectedCity.city_en,
    city_ar: selectedCity.city_ar,

    gender: nullableStringValue(formData, "gender"),
    date_of_birth: dateValue(formData, "date_of_birth"),

    nationality_slug: nationalitySlug,
    nationality: nationalitySlug,

    languages: stringArrayValue(formData, "languages"),
    dialects: stringArrayValue(formData, "dialects"),
    skills: stringArrayValue(formData, "skills"),

    bio_en: nullableStringValue(formData, "bio_en"),
    bio_ar: nullableStringValue(formData, "bio_ar"),

    instagram: nullableStringValue(formData, "instagram"),
    tiktok: nullableStringValue(formData, "tiktok"),
    snapchat: nullableStringValue(formData, "snapchat"),
    portfolio_url: nullableStringValue(formData, "portfolio_url"),

    availability_status: availabilityValue(formData),

    image_url: imageUrl,
    gallery_images: galleryImages,

    featured: false,
    verified: false,
    published: false,
    status: "pending",
    sort_order: null,
  };

  const { data: createdTalent, error: insertError } = await adminClient
    .from("talents")
    .insert(payload)
    .select("id, slug, category_slug, city_slug")
    .maybeSingle();

  if (insertError || !createdTalent) {
    throw new Error(
      `[createOwnTalentProfileAction] ${
        insertError?.message || "Failed to create talent profile."
      }`
    );
  }

  if (!createdTalent.category_slug || !createdTalent.city_slug) {
    throw new Error(
      "[createOwnTalentProfileAction] Talent profile was created, but category_slug or city_slug was not saved."
    );
  }

  const slug = createSlug(nameEn, createdTalent.id);

  const { error: slugError } = await adminClient
    .from("talents")
    .update({ slug })
    .eq("id", createdTalent.id)
    .eq("user_id", user.id);

  if (slugError) {
    throw new Error(`[createOwnTalentProfileAction] ${slugError.message}`);
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/profile");

  redirect("/ar/talent-dashboard/profile?created=1");
}

export async function updateOwnTalentProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError || !talent) {
    throw new Error("No linked talent profile found.");
  }

  const selectedCategory = getSelectedCategory(formData);
  const selectedCity = getSelectedCity(formData);
  const galleryImages = stringArrayValue(formData, "gallery_images");

  const nationalitySlug = nullableStringValue(
    formData,
    "nationality_slug"
  );

  const payload = {
    category_slug: selectedCategory.category_slug,
    category_en: selectedCategory.category_en,
    category_ar: selectedCategory.category_ar,

    city_slug: selectedCity.city_slug,
    city_en: selectedCity.city_en,
    city_ar: selectedCity.city_ar,

    gender: nullableStringValue(formData, "gender"),
    date_of_birth: dateValue(formData, "date_of_birth"),

    nationality_slug: nationalitySlug,
    nationality: nationalitySlug,

    languages: stringArrayValue(formData, "languages"),
    dialects: stringArrayValue(formData, "dialects"),
    skills: stringArrayValue(formData, "skills"),

    bio_en: nullableStringValue(formData, "bio_en"),
    bio_ar: nullableStringValue(formData, "bio_ar"),

    instagram: nullableStringValue(formData, "instagram"),
    tiktok: nullableStringValue(formData, "tiktok"),
    snapchat: nullableStringValue(formData, "snapchat"),
    portfolio_url: nullableStringValue(formData, "portfolio_url"),

    availability_status: availabilityValue(formData),

    image_url: requiredStringValue(formData, "image_url"),
    gallery_images: galleryImages,
  };

  const { data: updatedTalent, error: updateError } = await adminClient
    .from("talents")
    .update(payload)
    .eq("id", talent.id)
    .eq("user_id", user.id)
    .select("id, category_slug, city_slug")
    .maybeSingle();

  if (updateError || !updatedTalent) {
    throw new Error(
      `[updateOwnTalentProfileAction] ${
        updateError?.message || "Failed to update talent profile."
      }`
    );
  }

  if (!updatedTalent.category_slug || !updatedTalent.city_slug) {
    throw new Error(
      "[updateOwnTalentProfileAction] Talent profile was updated, but category_slug or city_slug was not saved."
    );
  }

  revalidatePath("/talent-dashboard");
  revalidatePath("/talent-dashboard/profile");

  if (talent.slug) {
    revalidatePath(`/ar/talent/${talent.slug}`);
    revalidatePath(`/en/talent/${talent.slug}`);
  }

  redirect("/ar/talent-dashboard/profile?updated=1");
}