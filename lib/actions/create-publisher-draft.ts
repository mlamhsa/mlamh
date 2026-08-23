"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale, type Locale } from "@/lib/i18n";

export type CreatePublisherDraftState = {
  success: boolean;
  message: string | null;
};

const ALLOWED_PUBLISHER_TYPES = [
  "production_company",
  "advertising_agency",
  "casting_agency",
  "talent_agency",
  "brand",
  "content_company",
  "individual",
  "other",
] as const;

export async function createPublisherDraftAction(
  _prevState: CreatePublisherDraftState,
  formData: FormData
): Promise<CreatePublisherDraftState> {
  const localeValue = String(formData.get("locale") ?? "ar");

  const locale: Locale = isValidLocale(localeValue)
    ? localeValue
    : "ar";

    const publisherMode = String(
      formData.get("publisher_mode") ?? ""
    ).trim();
    
    const selectedPublisherType = String(
      formData.get("publisher_type") ?? ""
    ).trim();
    
    if (
      publisherMode !== "individual" &&
      publisherMode !== "organization"
    ) {
      return {
        success: false,
        message:
          locale === "ar"
            ? "اختر إذا كنت فردًا / مستقلًا أو تمثل شركة / جهة."
            : "Choose whether you are an individual or represent an organization.",
      };
    }
    
    const publisherType =
      publisherMode === "individual"
        ? "individual"
        : selectedPublisherType;

        if (
          !ALLOWED_PUBLISHER_TYPES.includes(
            publisherType as (typeof ALLOWED_PUBLISHER_TYPES)[number]
          ) ||
          (
            publisherMode === "organization" &&
            publisherType === "individual"
          )
        ) {
          return {
            success: false,
            message:
              locale === "ar"
                ? "اختر نوع الشركة أو الجهة للمتابعة."
                : "Choose your organization type to continue.",
          };
        }

  try {
    const authClient =
      await createServerSupabaseClient();

    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message:
          locale === "ar"
            ? "يرجى تسجيل الدخول أولًا."
            : "Please sign in first.",
      };
    }

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from("profiles")
      .select(
        "id, account_type, display_name, onboarding_status, onboarding_step"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "[createPublisherDraftAction profileLookup]",
        profileError
      );

      return {
        success: false,
        message:
          locale === "ar"
            ? "تعذر تحميل بيانات حسابك."
            : "Unable to load your account.",
      };
    }

    if (!profile) {
      return {
        success: false,
        message:
          locale === "ar"
            ? "لم يتم العثور على ملف الحساب."
            : "Account profile was not found.",
      };
    }

    if (
      profile.account_type &&
      profile.account_type !== "publisher"
    ) {
      return {
        success: false,
        message:
          locale === "ar"
            ? "نوع هذا الحساب لا يسمح بإنشاء ملف ناشر."
            : "This account cannot create a publisher profile.",
      };
    }

    const contactName =
  String(
    user.user_metadata?.contact_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      profile.display_name ||
      user.email ||
      "Publisher"
  ).trim() || "Publisher";

    const {
      data: existingPublisher,
      error: publisherLookupError,
    } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherLookupError) {
      console.error(
        "[createPublisherDraftAction publisherLookup]",
        publisherLookupError
      );

      return {
        success: false,
        message:
          locale === "ar"
            ? "تعذر تجهيز ملف الناشر."
            : "Unable to prepare your publisher profile.",
      };
    }

    if (existingPublisher) {
      const { error: updateError } =
        await adminClient
          .from("publishers")
          .update({
            publisher_type: publisherType,
            contact_name: contactName,
            verified: false,
            verification_status: "unverified",
            verification_method: null,
            verification_email: null,
            verification_document_url: null,
            verification_submitted_at: null,
            verification_reviewed_at: null,
          })
          .eq("id", existingPublisher.id)
          .eq("profile_id", profile.id);

      if (updateError) {
        console.error(
          "[createPublisherDraftAction updatePublisher]",
          updateError
        );

        return {
          success: false,
          message:
            locale === "ar"
              ? "تعذر تحديث ملف الناشر."
              : "Unable to update your publisher profile.",
        };
      }
    } else {
      const { error: insertError } =
        await adminClient
          .from("publishers")
          .insert({
            profile_id: profile.id,
            publisher_type: publisherType,
            contact_name: contactName,
            verified: false,
            verification_status: "unverified",
            verification_method: null,
            verification_email: null,
            verification_document_url: null,
            verification_submitted_at: null,
            verification_reviewed_at: null,
          });

      if (insertError) {
        console.error(
          "[createPublisherDraftAction insertPublisher]",
          insertError
        );

        return {
          success: false,
          message:
            locale === "ar"
              ? "تعذر إنشاء ملف الناشر."
              : "Unable to create your publisher profile.",
        };
      }
    }

    const { error: onboardingError } =
      await adminClient
        .from("profiles")
        .update({
          account_type: "publisher",
          onboarding_status: "completed",
          onboarding_step: "dashboard",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .eq("user_id", user.id);

    if (onboardingError) {
      console.error(
        "[createPublisherDraftAction onboarding]",
        onboardingError
      );

      return {
        success: false,
        message:
          locale === "ar"
            ? "تم إنشاء ملف الناشر لكن تعذر إنهاء إعداد الحساب."
            : "The publisher profile was created, but account setup could not be completed.",
      };
    }

    return {
      success: true,
      message: null,
    };
  } catch (error) {
    console.error(
      "[createPublisherDraftAction]",
      error
    );

    return {
      success: false,
      message:
        locale === "ar"
          ? "حدث خطأ غير متوقع. حاول مرة أخرى."
          : "An unexpected error occurred. Please try again.",
    };
  }
}