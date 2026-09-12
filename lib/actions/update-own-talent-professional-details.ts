export type UpdateTalentProfessionalDetailsResult = {
  success: boolean;
  message: string;
};

/**
 * Browser transport for saving professional talent details.
 *
 * This intentionally uses a normal authenticated API request instead of a
 * Next.js Server Action. Calling a Server Action from this interactive client
 * form was causing the active App Router tree to refresh/remount after POST,
 * which reset the visible form state on mobile browsers even when the request
 * itself returned 200.
 */
export async function updateOwnTalentProfessionalDetailsAction(
  formData: FormData,
): Promise<UpdateTalentProfessionalDetailsResult> {
  try {
    const response = await fetch("/api/talent/profile/professional-details", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const result = (await response.json().catch(() => null)) as UpdateTalentProfessionalDetailsResult | null;

    if (!response.ok || !result) {
      const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
      return {
        success: false,
        message:
          result?.message ||
          (locale === "ar"
            ? "تعذر حفظ البيانات المهنية. حاول مرة أخرى."
            : "Unable to save professional details. Please try again."),
      };
    }

    return result;
  } catch {
    const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر الاتصال بالخادم لحفظ البيانات المهنية. حاول مرة أخرى."
          : "Could not reach the server to save professional details. Please try again.",
    };
  }
}
