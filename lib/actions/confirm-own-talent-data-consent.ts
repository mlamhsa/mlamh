"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TalentDataConsentState = {
  confirmed: boolean;
  confirmedAt: string | null;
};

async function getAuthenticatedTalentUser() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getOwnTalentDataConsentAction(): Promise<TalentDataConsentState | null> {
  const user = await getAuthenticatedTalentUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("account_type, data_accuracy_contact_consent, data_accuracy_contact_consent_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getOwnTalentDataConsentAction]", error);
    return null;
  }

  if (!data || data.account_type !== "talent") return null;

  return {
    confirmed: data.data_accuracy_contact_consent === true,
    confirmedAt: data.data_accuracy_contact_consent_at ?? null,
  };
}

export async function confirmOwnTalentDataConsentAction(
  locale: "ar" | "en",
): Promise<{ success: boolean; message: string; confirmedAt?: string }> {
  const user = await getAuthenticatedTalentUser();
  if (!user) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "انتهت الجلسة. سجّل الدخول مرة أخرى."
          : "Your session expired. Please sign in again.",
    };
  }

  const admin = createAdminClient();
  const confirmedAt = new Date().toISOString();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, account_type, data_accuracy_contact_consent")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.account_type !== "talent") {
    console.error("[confirmOwnTalentDataConsentAction:profile]", profileError);
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر العثور على حساب الموهبة."
          : "Unable to find the talent account.",
    };
  }

  if (profile.data_accuracy_contact_consent === true) {
    return {
      success: true,
      message:
        locale === "ar"
          ? "الموافقة مسجلة بالفعل."
          : "Your confirmation is already recorded.",
    };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      data_accuracy_contact_consent: true,
      data_accuracy_contact_consent_at: confirmedAt,
    })
    .eq("id", profile.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[confirmOwnTalentDataConsentAction:update]", updateError);
    return {
      success: false,
      message:
        locale === "ar"
          ? "تعذر حفظ الموافقة حاليًا."
          : "Unable to save your confirmation right now.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard`);
  revalidatePath(`/${locale}/talent-dashboard/profile`);
  revalidatePath("/admin/talents");

  return {
    success: true,
    confirmedAt,
    message:
      locale === "ar"
        ? "تم تسجيل موافقتك."
        : "Your confirmation has been recorded.",
  };
}
