"use server";

import {
  updateOwnTalentVisibilityAction,
  type TalentVisibility,
} from "@/lib/actions/update-own-talent-visibility";

export type UpdateTalentProfileVisibilityResult = {
  success: boolean;
  message: string;
};

export async function updateOwnTalentProfileVisibilityAction(
  formData: FormData,
): Promise<UpdateTalentProfileVisibilityResult> {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const visibility = String(formData.get("profile_visibility") ?? "").trim().toLowerCase();

  if (visibility !== "public" && visibility !== "private") {
    return {
      success: false,
      message: isArabic ? "اختر طريقة ظهور الملف." : "Choose your profile visibility.",
    };
  }

  const result = await updateOwnTalentVisibilityAction(
    visibility as TalentVisibility,
    locale,
  );

  return {
    success: result.success,
    message: result.message,
  };
}
