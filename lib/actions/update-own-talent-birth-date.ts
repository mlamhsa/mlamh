export type UpdateTalentBirthDateResult = {
  success: boolean;
  message: string;
};

/**
 * Browser transport for saving date of birth without invoking a Server Action.
 * This keeps the active talent editor mounted so its local form state and
 * feedback are not reset after save.
 */
export async function updateOwnTalentBirthDateAction(
  formData: FormData,
): Promise<UpdateTalentBirthDateResult> {
  try {
    const response = await fetch("/api/talent/profile/birth-date", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const result = (await response.json().catch(() => null)) as UpdateTalentBirthDateResult | null;
    const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";

    if (!response.ok || !result) {
      return {
        success: false,
        message:
          result?.message ||
          (locale === "ar"
            ? "تعذر حفظ تاريخ الميلاد الآن."
            : "We could not save your date of birth right now."),
      };
    }

    return result;
  } catch {
    const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر الاتصال بالخادم لحفظ تاريخ الميلاد."
          : "Could not reach the server to save your date of birth.",
    };
  }
}
