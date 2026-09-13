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

const INDIVIDUAL_ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  project_owner: { ar: "صاحب مشروع", en: "project owner" },
  photographer: { ar: "مصور", en: "photographer" },
  content_creator: { ar: "صانع محتوى", en: "content creator" },
  event_organizer: { ar: "منظم فعالية", en: "event organizer" },
  freelancer: { ar: "مستقل", en: "freelancer" },
  student_project: { ar: "مشروع طلابي", en: "student project" },
  other: { ar: "استخدام فردي آخر", en: "other individual use" },
};

const USE_CASE_LABELS: Record<string, { ar: string; en: string }> = {
  product_shoot: { ar: "تصوير المنتجات", en: "product shoots" },
  social_content: { ar: "محتوى السوشيال ميديا", en: "social media content" },
  advertising: { ar: "الإعلانات والحملات", en: "advertising and campaigns" },
  event: { ar: "الفعاليات", en: "events" },
  commercial_shoot: { ar: "التصوير التجاري", en: "commercial shoots" },
  other: { ar: "احتياج مهني آخر", en: "another professional need" },
};

const BUSINESS_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  fashion_store: { ar: "متجر أزياء", en: "fashion store" },
  salon: { ar: "صالون / تجميل", en: "salon / beauty business" },
  restaurant: { ar: "مطعم / مقهى", en: "restaurant / cafe" },
  ecommerce: { ar: "متجر إلكتروني", en: "e-commerce business" },
  studio: { ar: "استوديو تصوير", en: "photography studio" },
  events: { ar: "نشاط تنظيم فعاليات", en: "events business" },
  other: { ar: "نشاط تجاري آخر", en: "other business" },
};

function formValue(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function fastTrackDescription({
  locale,
  mode,
  role,
  useCase,
  businessType,
}: {
  locale: Locale;
  mode: "individual" | "business";
  role: string;
  useCase: string;
  businessType: string;
}) {
  if (mode === "business") {
    const label = BUSINESS_TYPE_LABELS[businessType]?.[locale] ?? businessType;
    return locale === "ar"
      ? `${label} يستخدم ملامح للوصول إلى المواهب للمشاريع والتصوير والمحتوى.`
      : `${label} using MLAMH to source talent for projects, shoots, and content.`;
  }

  const roleLabel = INDIVIDUAL_ROLE_LABELS[role]?.[locale] ?? role;
  const useCaseLabel = USE_CASE_LABELS[useCase]?.[locale] ?? useCase;
  return locale === "ar"
    ? `${roleLabel} يستخدم ملامح من أجل ${useCaseLabel}.`
    : `${roleLabel} using MLAMH for ${useCaseLabel}.`;
}

function fastTrackSubtype({
  mode,
  role,
  useCase,
  businessType,
}: {
  mode: "individual" | "business";
  role: string;
  useCase: string;
  businessType: string;
}) {
  return mode === "business"
    ? `fast:business:${businessType}`
    : `fast:individual:${role}:${useCase}`;
}

export async function createPublisherDraftAction(
  _prevState: CreatePublisherDraftState,
  formData: FormData,
): Promise<CreatePublisherDraftState> {
  const localeValue = formValue(formData, "locale") || "ar";
  const locale: Locale = isValidLocale(localeValue) ? localeValue : "ar";

  const publisherMode = formValue(formData, "publisher_mode");
  const selectedPublisherType = formValue(formData, "publisher_type");
  const isFastTrack = publisherMode === "individual" || publisherMode === "business";

  if (!isFastTrack && publisherMode !== "organization") {
    return {
      success: false,
      message:
        locale === "ar"
          ? "اختر إذا كنت فردًا / صاحب مشروع أو نشاطًا تجاريًا أو تمثل شركة / جهة."
          : "Choose whether you are an individual, business, or organization.",
    };
  }

  const publisherType = isFastTrack ? "individual" : selectedPublisherType;

  if (
    !ALLOWED_PUBLISHER_TYPES.includes(
      publisherType as (typeof ALLOWED_PUBLISHER_TYPES)[number],
    ) ||
    (publisherMode === "organization" && publisherType === "individual")
  ) {
    return {
      success: false,
      message:
        locale === "ar"
          ? "اختر نوع الشركة أو الجهة للمتابعة."
          : "Choose your organization type to continue.",
    };
  }

  const contactName = formValue(formData, "contact_name");
  const phone = formValue(formData, "phone");
  const city = formValue(formData, "city");
  const companyName = formValue(formData, "company_name");
  const socialLink = formValue(formData, "social_link");
  const publisherRole = formValue(formData, "publisher_role");
  const useCase = formValue(formData, "use_case");
  const businessType = formValue(formData, "business_type");

  if (isFastTrack) {
    const missing = [
      !contactName ? (locale === "ar" ? "الاسم الكامل" : "full name") : null,
      !phone ? (locale === "ar" ? "رقم الجوال" : "mobile number") : null,
      !city ? (locale === "ar" ? "المدينة" : "city") : null,
      publisherMode === "individual" && !publisherRole
        ? locale === "ar" ? "الصفة" : "role"
        : null,
      publisherMode === "individual" && !useCase
        ? locale === "ar" ? "سبب الاستخدام" : "use case"
        : null,
      publisherMode === "business" && !companyName
        ? locale === "ar" ? "اسم النشاط" : "business name"
        : null,
      publisherMode === "business" && !businessType
        ? locale === "ar" ? "نوع النشاط" : "business type"
        : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      return {
        success: false,
        message:
          locale === "ar"
            ? `أكمل البيانات المطلوبة: ${missing.join("، ")}.`
            : `Complete the required details: ${missing.join(", ")}.`,
      };
    }
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
      .select("id, account_type, display_name, onboarding_status, onboarding_step, approval_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      if (profileError) console.error("[createPublisherDraftAction profileLookup]", profileError);
      return {
        success: false,
        message: locale === "ar" ? "تعذر تحميل بيانات حسابك." : "Unable to load your account.",
      };
    }

    if (profile.account_type && profile.account_type !== "publisher") {
      return {
        success: false,
        message:
          locale === "ar"
            ? "نوع هذا الحساب لا يسمح بإنشاء ملف ناشر."
            : "This account cannot create a publisher profile.",
      };
    }

    const fallbackContactName =
      String(
        user.user_metadata?.contact_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          profile.display_name ||
          user.email ||
          "Publisher",
      ).trim() || "Publisher";

    const finalContactName = isFastTrack ? contactName : fallbackContactName;

    const { data: existingPublisher, error: publisherLookupError } = await adminClient
      .from("publishers")
      .select("id, publisher_type, publisher_type_other, company_name, contact_name, phone, city, description, instagram")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherLookupError) {
      console.error("[createPublisherDraftAction publisherLookup]", publisherLookupError);
      return {
        success: false,
        message: locale === "ar" ? "تعذر تجهيز ملف الناشر." : "Unable to prepare your publisher profile.",
      };
    }

    let hasExistingActivity = false;
    if (existingPublisher) {
      const { count, error: opportunityCountError } = await adminClient
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("publisher_id", existingPublisher.id);

      if (opportunityCountError) {
        console.error("[createPublisherDraftAction opportunityCount]", opportunityCountError);
      } else {
        hasExistingActivity = (count ?? 0) > 0;
      }
    }

    const approvalStatus = String(profile.approval_status ?? "not_submitted").trim().toLowerCase();
    const isDraftAccount = approvalStatus === "not_submitted" && !hasExistingActivity;

    // Critical compatibility guard: this onboarding step may enrich only a new/draft
    // publisher account. Established accounts and accounts with live activity keep
    // their existing identity and data untouched.
    const fastDescription = isFastTrack
      ? fastTrackDescription({
          locale,
          mode: publisherMode as "individual" | "business",
          role: publisherRole,
          useCase,
          businessType,
        })
      : null;
    const subtype = isFastTrack
      ? fastTrackSubtype({
          mode: publisherMode as "individual" | "business",
          role: publisherRole,
          useCase,
          businessType,
        })
      : null;

    if (existingPublisher) {
      const updateData: Record<string, string | null> = {
        publisher_type: isDraftAccount
          ? publisherType
          : existingPublisher.publisher_type || publisherType,
        contact_name: isDraftAccount ? finalContactName : existingPublisher.contact_name,
      };

      if (isDraftAccount && isFastTrack) {
        updateData.publisher_type_other = subtype;
        updateData.company_name = companyName || null;
        updateData.phone = phone;
        updateData.city = city;
        updateData.description = fastDescription;
        updateData.instagram = socialLink || null;
      }

      const { error: updateError } = await adminClient
        .from("publishers")
        .update(updateData)
        .eq("id", existingPublisher.id)
        .eq("profile_id", profile.id);

      if (updateError) {
        console.error("[createPublisherDraftAction updatePublisher]", updateError);
        return {
          success: false,
          message: locale === "ar" ? "تعذر تحديث ملف الناشر." : "Unable to update your publisher profile.",
        };
      }
    } else {
      const { error: insertError } = await adminClient.from("publishers").insert({
        profile_id: profile.id,
        publisher_type: publisherType,
        publisher_type_other: subtype,
        contact_name: finalContactName,
        company_name: isFastTrack ? companyName || null : null,
        phone: isFastTrack ? phone : null,
        city: isFastTrack ? city : null,
        description: fastDescription,
        instagram: isFastTrack ? socialLink || null : null,
        email: user.email || null,
        verified: false,
        verification_status: "unverified",
        verification_method: null,
        verification_email: null,
        verification_document_url: null,
        verification_submitted_at: null,
        verification_reviewed_at: null,
      });

      if (insertError) {
        console.error("[createPublisherDraftAction insertPublisher]", insertError);
        return {
          success: false,
          message: locale === "ar" ? "تعذر إنشاء ملف الناشر." : "Unable to create your publisher profile.",
        };
      }
    }

    const profileUpdate: Record<string, string> = {
      account_type: "publisher",
      onboarding_status: "completed",
      onboarding_step: "dashboard",
      updated_at: new Date().toISOString(),
    };

    if (isDraftAccount && isFastTrack) {
      // Fast publishers already supplied the required trust/context fields above.
      // This preserves the existing product behavior where individual publishers
      // can activate without organization review, while request review remains separate.
      profileUpdate.approval_status = "approved";
      profileUpdate.display_name = finalContactName;
      profileUpdate.phone = phone;
    }

    const { error: onboardingError } = await adminClient
      .from("profiles")
      .update(profileUpdate)
      .eq("id", profile.id)
      .eq("user_id", user.id);

    if (onboardingError) {
      console.error("[createPublisherDraftAction onboarding]", onboardingError);
      return {
        success: false,
        message:
          locale === "ar"
            ? "تم إنشاء ملف الناشر لكن تعذر إنهاء إعداد الحساب."
            : "The publisher profile was created, but account setup could not be completed.",
      };
    }

    return { success: true, message: null };
  } catch (error) {
    console.error("[createPublisherDraftAction]", error);
    return {
      success: false,
      message:
        locale === "ar"
          ? "حدث خطأ غير متوقع. حاول مرة أخرى."
          : "An unexpected error occurred. Please try again.",
    };
  }
}
