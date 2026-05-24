"use server";

import { createAdminClient } from "@/lib/supabase/admin";
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

export async function submitTalentAction(
  _prevState: SubmitTalentState,
  formData: FormData,
): Promise<SubmitTalentState> {
  const localeParam = formData.get("locale");
  const locale =
    typeof localeParam === "string" && isValidLocale(localeParam)
      ? (localeParam as Locale)
      : "ar";

  const errorMessages = {
    generic:
      locale === "ar"
        ? "تعذر إرسال الطلب. حاول مرة أخرى."
        : "Unable to submit your application. Please try again.",
    success:
      locale === "ar"
        ? "تم استلام طلبك بنجاح."
        : "Your application has been received.",
  };

  const data = parseTalentSubmissionForm(formData);
  const validationMessages = getValidationMessages(locale);
  const errors = validateTalentSubmission(data, validationMessages);

  if (hasValidationErrors(errors)) {
    return { success: false, errors, message: null };
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("talents").insert({
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
      status: "pending",
      published: false,
      featured: false,
      image_url: PENDING_IMAGE_PLACEHOLDER,
    });

    if (error) {
      console.error("[submitTalentAction]", error.message);
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