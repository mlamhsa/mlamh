"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { TALENT_CATEGORIES } from "@/lib/data/talent-categories";

export type CreateTalentDraftState = {
  success: boolean;
  message: string | null;
};

const EDITABLE_APPROVAL_STATUSES = new Set(["not_submitted", "rejected", "changes_requested"]);

function createTalentSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "");

  return `${base || "talent"}-${userId.slice(0, 8)}`;
}

export async function createTalentDraftAction(
  _prevState: CreateTalentDraftState,
  formData: FormData
): Promise<CreateTalentDraftState> {
  const localeValue = String(formData.get("locale") ?? "ar");
  const locale: Locale = isValidLocale(localeValue) ? localeValue : "ar";
  const primaryRole = String(formData.get("primary_role") ?? "").trim();
  const selectedCategory = TALENT_CATEGORIES.find(
    (category) => category.slug === primaryRole,
  );

  if (!selectedCategory) {
    return {
      success: false,
      message: locale === "ar" ? "اختر نوع موهبتك للمتابعة." : "Choose your talent type to continue.",
    };
  }

  try {
    const authClient = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: locale === "ar" ? "يرجى تسجيل الدخول أولًا." : "Please sign in first.",
      };
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, display_name, account_type, approval_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[createTalentDraftAction profile]", profileError);
      return {
        success: false,
        message: locale === "ar" ? "تعذر تحميل بيانات حسابك." : "Unable to load your account.",
      };
    }

    if (profile?.account_type && profile.account_type !== "talent") {
      return {
        success: false,
        message: locale === "ar" ? "نوع هذا الحساب لا يسمح بإنشاء ملف موهبة." : "This account cannot create a talent profile.",
      };
    }

    const approvalStatus = String(profile?.approval_status ?? "not_submitted").trim().toLowerCase();
    if (!EDITABLE_APPROVAL_STATUSES.has(approvalStatus)) {
      return {
        success: false,
        message: locale === "ar"
          ? "لا يمكن تغيير نوع الموهبة أثناء المراجعة أو بعد اعتماد الملف."
          : "Talent type cannot be changed while the profile is under review or after approval.",
      };
    }

    const displayName = String(
      profile?.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        "Talent"
    ).trim() || "Talent";

    const { data: existingTalent, error: talentLookupError } = await adminClient
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (talentLookupError) {
      console.error("[createTalentDraftAction talentLookup]", talentLookupError);
      return {
        success: false,
        message: locale === "ar" ? "تعذر تجهيز ملف الموهبة." : "Unable to prepare your talent profile.",
      };
    }

    let createdTalentId: number | string | null = null;

    if (existingTalent) {
      const { error: updateError } = await adminClient
        .from("talents")
        .update({
          category_slug: selectedCategory.slug,
          category_en: selectedCategory.en,
          category_ar: selectedCategory.ar,
          primary_role: selectedCategory.slug,
        })
        .eq("id", existingTalent.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[createTalentDraftAction updateTalent]", updateError);
        return {
          success: false,
          message: locale === "ar" ? "تعذر تحديث نوع موهبتك." : "Unable to update your talent type.",
        };
      }
    } else {
      const slug = createTalentSlug(displayName, user.id);
      const { data: createdTalent, error: insertError } = await adminClient
        .from("talents")
        .insert({
          user_id: user.id,
          name_en: displayName,
          name_ar: displayName,
          category_slug: selectedCategory.slug,
          category_en: selectedCategory.en,
          category_ar: selectedCategory.ar,
          primary_role: selectedCategory.slug,
          image_url: null,
          slug,
          status: "draft",
          published: false,
          verified: false,
          featured: false,
          profile_completion: 0,
        })
        .select("id")
        .single();

      if (insertError || !createdTalent) {
        console.error("[createTalentDraftAction insertTalent]", insertError);
        return {
          success: false,
          message: locale === "ar" ? "تعذر إنشاء ملف الموهبة." : "Unable to create your talent profile.",
        };
      }

      createdTalentId = createdTalent.id;
    }

    const { error: onboardingError } = await adminClient
      .from("profiles")
      .update({
        account_type: "talent",
        onboarding_status: "profile_in_progress",
        onboarding_step: "talent_profile",
        approval_status: "not_submitted",
        profile_completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (onboardingError) {
      console.error("[createTalentDraftAction onboarding]", onboardingError);

      if (createdTalentId !== null) {
        const { error: rollbackError } = await adminClient
          .from("talents")
          .delete()
          .eq("id", createdTalentId)
          .eq("user_id", user.id)
          .eq("status", "draft")
          .eq("published", false);
        if (rollbackError) {
          console.error("[createTalentDraftAction rollbackTalent]", rollbackError);
        }
      }

      return {
        success: false,
        message: locale === "ar"
          ? "تعذر إكمال إنشاء ملف الموهبة. حاول مرة أخرى."
          : "Unable to complete talent profile setup. Please try again.",
      };
    }

    return { success: true, message: null };
  } catch (error) {
    console.error("[createTalentDraftAction]", error);
    return {
      success: false,
      message: locale === "ar" ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.",
    };
  }
}