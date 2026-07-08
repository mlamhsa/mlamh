"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";
import {
  getValidationMessages,
  hasValidationErrors,
  parseTalentSubmissionForm,
  validateTalentSubmission,
  type TalentSubmissionErrors,
} from "@/lib/validations/talent-submission";

const PENDING_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80";

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

function createTalentSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "");

  return `${base || "talent"}-${userId.slice(0, 8)}`;
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

    success:
      locale === "ar"
        ? "تم حفظ ملفك بنجاح."
        : "Your profile has been saved.",
  };

  const data = parseTalentSubmissionForm(formData);
  const validationMessages = getValidationMessages(locale);
  const errors = validateTalentSubmission(data, validationMessages);

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
    } = await authClient.auth.getUser();

    if (!user) {
      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.auth,
      };
    }

    const imageUrl =
      getStringValue(formData, "image_url") || PENDING_IMAGE_PLACEHOLDER;

    const galleryImages = getStringArray(formData, "gallery_images");

    const { data: existingProfile, error: profileFetchError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileFetchError) {
      console.error("[submitTalentAction profileFetch]", profileFetchError.message);

      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.generic,
      };
    }

    let profileId = existingProfile?.id;

    if (!profileId) {
      const { data: createdProfile, error: profileCreateError } =
        await adminClient
          .from("profiles")
          .insert({
            user_id: user.id,
            account_type: "talent",
          })
          .select("id")
          .single();

      if (profileCreateError || !createdProfile?.id) {
        console.error("[submitTalentAction profileCreate]", profileCreateError?.message);

        return {
          success: false,
          errors: initialErrors,
          message: errorMessages.generic,
        };
      }

      profileId = createdProfile.id;
    } else {
      const { error: profileUpdateError } = await adminClient
        .from("profiles")
        .update({
          account_type: "talent",
        })
        .eq("id", profileId);

      if (profileUpdateError) {
        console.error("[submitTalentAction profileUpdate]", profileUpdateError.message);

        return {
          success: false,
          errors: initialErrors,
          message: errorMessages.generic,
        };
      }
    }

    const slug = createTalentSlug(data.name_en || data.name_ar, user.id);

    const talentPayload = {
      profile_id: profileId,

      name_en: data.name_en,
      name_ar: data.name_ar,

      category_en: data.category_en,
      category_ar: data.category_ar,

      city_en: data.city_en,
      city_ar: data.city_ar,

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

    const { data: existingTalent, error: existingTalentError } = await adminClient
      .from("talents")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existingTalentError) {
      console.error("[submitTalentAction existingTalent]", existingTalentError.message);

      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.generic,
      };
    }

    const { error: talentError } = existingTalent
      ? await adminClient
          .from("talents")
          .update(talentPayload)
          .eq("id", existingTalent.id)
      : await adminClient.from("talents").insert(talentPayload);

    if (talentError) {
      console.error("[submitTalentAction talentSave]", talentError.message);

      return {
        success: false,
        errors: initialErrors,
        message: errorMessages.generic,
      };
    }

    return {
      success: true,
      errors: initialErrors,
      message: errorMessages.success,
    };
  } catch (err) {
    console.error("[submitTalentAction]", err);

    return {
      success: false,
      errors: initialErrors,
      message: errorMessages.generic,
    };
  }
}