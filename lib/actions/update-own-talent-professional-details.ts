export type UpdateTalentProfessionalDetailsResult = {
  success: boolean;
  message: string;
};

function removeElement(id: string) {
  document.getElementById(id)?.remove();
}

function showSavingOverlay(locale: "ar" | "en") {
  const id = "mlamh-professional-save-overlay";
  removeElement(id);

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483646",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:20px",
    "background:rgba(0,0,0,.62)",
    "backdrop-filter:blur(3px)",
    "-webkit-backdrop-filter:blur(3px)",
  ].join(";");

  overlay.innerHTML = `
    <div style="width:100%;max-width:360px;min-height:86px;display:flex;align-items:center;justify-content:center;gap:14px;border:1px solid rgba(201,169,98,.35);border-radius:24px;background:rgba(9,9,9,.98);box-shadow:0 24px 70px rgba(0,0,0,.65);padding:20px 24px;color:#fff;font-family:inherit">
      <span style="width:24px;height:24px;flex:0 0 24px;border:2px solid rgba(201,169,98,.25);border-top-color:#d4af6a;border-radius:999px;animation:mlamh-inline-spin .7s linear infinite"></span>
      <span style="font-size:14px;font-weight:600;text-align:center">${locale === "ar" ? "جارٍ حفظ بياناتك المهنية..." : "Saving your professional details..."}</span>
    </div>
    <style>@keyframes mlamh-inline-spin{to{transform:rotate(360deg)}}</style>
  `;

  document.body.appendChild(overlay);
  return id;
}

function showResultToast(message: string, success: boolean) {
  const id = "mlamh-professional-save-toast";
  removeElement(id);

  const toast = document.createElement("div");
  toast.id = id;
  toast.setAttribute("role", success ? "status" : "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.style.cssText = [
    "position:fixed",
    "left:16px",
    "right:16px",
    "top:max(88px,calc(env(safe-area-inset-top) + 58px))",
    "z-index:2147483647",
    "max-width:560px",
    "margin:0 auto",
    "padding:16px 18px",
    "border-radius:18px",
    `border:1px solid ${success ? "rgba(52,211,153,.38)" : "rgba(248,113,113,.38)"}`,
    `background:${success ? "rgba(6,40,30,.98)" : "rgba(55,12,12,.98)"}`,
    `color:${success ? "#d1fae5" : "#fee2e2"}`,
    "box-shadow:0 20px 60px rgba(0,0,0,.65)",
    "backdrop-filter:blur(16px)",
    "-webkit-backdrop-filter:blur(16px)",
    "font-size:14px",
    "font-weight:700",
    "line-height:1.7",
    "text-align:center",
    "font-family:inherit",
  ].join(";");
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => removeElement(id), 5000);
}

/**
 * Browser transport for saving professional talent details.
 *
 * Uses a normal authenticated API request instead of a Next.js Server Action
 * so the active editor does not remount after save. Feedback is mounted
 * directly under document.body to guarantee it stays above the mobile shell,
 * sticky headers and page stacking contexts on iOS browsers.
 */
export async function updateOwnTalentProfessionalDetailsAction(
  formData: FormData,
): Promise<UpdateTalentProfessionalDetailsResult> {
  const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
  const startedAt = Date.now();
  const overlayId = showSavingOverlay(locale);

  async function keepSavingStateVisible() {
    const elapsed = Date.now() - startedAt;
    const minimumVisibleMs = 900;
    if (elapsed < minimumVisibleMs) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, minimumVisibleMs - elapsed));
    }
  }

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
    await keepSavingStateVisible();
    removeElement(overlayId);

    if (!response.ok || !result) {
      const failed = {
        success: false,
        message:
          result?.message ||
          (locale === "ar"
            ? "تعذر حفظ البيانات المهنية. حاول مرة أخرى."
            : "Unable to save professional details. Please try again."),
      };
      showResultToast(failed.message, false);
      return failed;
    }

    showResultToast(
      locale === "ar" ? "تم حفظ بياناتك المهنية بنجاح ✓" : "Your professional details were saved successfully ✓",
      true,
    );
    return result;
  } catch {
    await keepSavingStateVisible();
    removeElement(overlayId);
    const failed = {
      success: false,
      message:
        locale === "ar"
          ? "تعذر الاتصال بالخادم لحفظ البيانات المهنية. حاول مرة أخرى."
          : "Could not reach the server to save professional details. Please try again.",
    };
    showResultToast(failed.message, false);
    return failed;
  }
}
