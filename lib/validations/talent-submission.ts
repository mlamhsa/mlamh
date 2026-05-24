import type { Locale } from "@/lib/i18n";

export type TalentSubmissionInput = {
  name_en: string;
  name_ar: string;
  category_en: string;
  category_ar: string;
  city_en: string | null;
  city_ar: string | null;
  age: number | null;
  height: string | null;
  bio_en: string | null;
  bio_ar: string | null;
  whatsapp: string;
  instagram: string | null;
};

export type TalentSubmissionErrors = Partial<
  Record<keyof TalentSubmissionInput | "form", string>
>;

function trim(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalTrim(value: FormDataEntryValue | null): string | null {
  const trimmed = trim(value);
  return trimmed.length > 0 ? trimmed : null;
}

export function parseTalentSubmissionForm(
  formData: FormData,
): TalentSubmissionInput {
  const ageRaw = trim(formData.get("age"));
  let age: number | null = null;
  if (ageRaw) {
    const parsed = Number(ageRaw);
    if (Number.isFinite(parsed)) age = Math.round(parsed);
  }

  return {
    name_en: trim(formData.get("name_en")),
    name_ar: trim(formData.get("name_ar")),
    category_en: trim(formData.get("category_en")),
    category_ar: trim(formData.get("category_ar")),
    city_en: optionalTrim(formData.get("city_en")),
    city_ar: optionalTrim(formData.get("city_ar")),
    age,
    height: optionalTrim(formData.get("height")),
    bio_en: optionalTrim(formData.get("bio_en")),
    bio_ar: optionalTrim(formData.get("bio_ar")),
    whatsapp: trim(formData.get("whatsapp")),
    instagram: optionalTrim(formData.get("instagram")),
  };
}

export function validateTalentSubmission(
  data: TalentSubmissionInput,
  messages: {
    required: string;
    invalidAge: string;
  },
): TalentSubmissionErrors {
  const errors: TalentSubmissionErrors = {};

  if (!data.name_en) errors.name_en = messages.required;
  if (!data.name_ar) errors.name_ar = messages.required;
  if (!data.category_en) errors.category_en = messages.required;
  if (!data.category_ar) errors.category_ar = messages.required;
  if (!data.whatsapp) errors.whatsapp = messages.required;

  if (data.age != null && (data.age < 1 || data.age > 120)) {
    errors.age = messages.invalidAge;
  }

  return errors;
}

export function hasValidationErrors(errors: TalentSubmissionErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getValidationMessages(locale: Locale) {
  const isAr = locale === "ar";
  return {
    required: isAr ? "هذا الحقل مطلوب" : "This field is required",
    invalidAge: isAr
      ? "يرجى إدخال عمر صحيح"
      : "Please enter a valid age",
  };
}
