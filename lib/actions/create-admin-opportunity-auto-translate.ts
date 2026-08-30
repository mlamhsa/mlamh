"use server";

import { redirect } from "next/navigation";

import { createAdminOpportunityAction } from "@/lib/actions/create-admin-opportunity";
import { translateOpportunityContent } from "@/lib/ai/translate-opportunity";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { createAdminClient } from "@/lib/supabase/admin";

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: FormDataEntryValue | null) {
  const raw = stringValue(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createAdminOpportunityAutoTranslateFormAction(
  formData: FormData,
) {
  const sourceLanguage =
    formData.get("content_language") === "en" ? "en" : "ar";

  const sourceTitle = stringValue(formData.get("title"));
  const sourceDescription = stringValue(formData.get("description"));

  if (!sourceTitle || !sourceDescription) {
    throw new Error(
      sourceLanguage === "ar"
        ? "أدخل عنوان الفرصة ووصفها."
        : "Enter the opportunity title and description.",
    );
  }

  const translated = await translateOpportunityContent({
    sourceLanguage,
    title: sourceTitle,
    description: sourceDescription,
  });

  const titleAr =
    sourceLanguage === "ar" ? sourceTitle : translated.title;
  const descriptionAr =
    sourceLanguage === "ar" ? sourceDescription : translated.description;
  const titleEn =
    sourceLanguage === "en" ? sourceTitle : translated.title;
  const descriptionEn =
    sourceLanguage === "en" ? sourceDescription : translated.description;

  const sourceType =
    formData.get("source_type") === "client" ? "client" : "mlamh";

  const publicSourceModeRaw = stringValue(
    formData.get("public_source_mode"),
  );
  const publicSourceMode =
    publicSourceModeRaw === "client_name" ||
    publicSourceModeRaw === "mlamh_clients"
      ? publicSourceModeRaw
      : "mlamh";

  const citySlug = stringValue(formData.get("city_slug"));
  const city =
    SAUDI_CITIES.find((item) => item.slug === citySlug) ?? null;

  if (!city) {
    throw new Error("يرجى اختيار مدينة صحيحة.");
  }

  const clientCompanyName = stringValue(
    formData.get("client_company_name"),
  );

  let publicCompanyName = "ملامح";

  if (sourceType === "client" && publicSourceMode === "client_name") {
    if (!clientCompanyName) {
      throw new Error("اسم الجهة أو العميل مطلوب.");
    }
    publicCompanyName = clientCompanyName;
  }

  if (sourceType === "client" && publicSourceMode === "mlamh_clients") {
    publicCompanyName = "من عملاء ملامح";
  }

  const compensationRaw = stringValue(
    formData.get("compensation_type"),
  );
  const compensationType: "fixed" | "negotiable" | "unpaid" =
    compensationRaw === "negotiable" || compensationRaw === "unpaid"
      ? compensationRaw
      : "fixed";

  const budget =
    compensationType === "fixed"
      ? stringValue(formData.get("budget")) || null
      : null;

  if (compensationType === "fixed" && !budget) {
    throw new Error("أدخل مبلغ الفرصة.");
  }

  const result = await createAdminOpportunityAction({
    sourceType,
    companyName: publicCompanyName,
    contactName:
      sourceType === "client"
        ? stringValue(formData.get("contact_name")) || null
        : null,
    contactPhone:
      sourceType === "client"
        ? stringValue(formData.get("contact_phone")) || null
        : null,
    contactEmail:
      sourceType === "client"
        ? stringValue(formData.get("contact_email")) || null
        : null,
    postingMode: "project",
    title: titleAr,
    description: descriptionAr,
    opportunityType:
      formData.get("opportunity_type") === "actor" ? "actor" : "model",
    citySlug: city.slug,
    cityAr: city.ar,
    cityEn: city.en,
    requiredGender:
      formData.get("required_gender") === "male"
        ? "male"
        : formData.get("required_gender") === "female"
          ? "female"
          : "any",
    minAge: numberValue(formData.get("min_age")),
    maxAge: numberValue(formData.get("max_age")),
    requiredCount: numberValue(formData.get("required_count")),
    compensationType,
    budget,
    applicationDays: numberValue(formData.get("application_days")),
    workDate: stringValue(formData.get("work_date")) || null,
    workTime: stringValue(formData.get("work_time")) || null,
    workDuration: stringValue(formData.get("work_duration")) || null,
    roleRequirements: {
      managed_by: "mlamh",
      source_type: sourceType,
      public_source_mode: publicSourceMode,
      client_company_name:
        sourceType === "client" ? clientCompanyName : null,
      source_content_language: sourceLanguage,
      auto_translated: true,
    },
    publishNow: formData.get("publish_now") === "true",
  });

  const opportunityId = result?.opportunity?.id;

  if (!opportunityId) {
    throw new Error("تعذر إنشاء الفرصة.");
  }

  const adminClient = createAdminClient();
  const { error: localizationError } = await adminClient
    .from("opportunities")
    .update({
      title_en: titleEn,
      description_en: descriptionEn,
    })
    .eq("id", opportunityId);

  if (localizationError) {
    console.error(
      "[createAdminOpportunityAutoTranslateFormAction] localization",
      localizationError,
    );

    await adminClient
      .from("opportunities")
      .update({ status: "draft", published: false })
      .eq("id", opportunityId);

    throw new Error(
      "تم إنشاء المسودة لكن تعذر حفظ الترجمة. أعد المحاولة قبل النشر.",
    );
  }

  redirect(`/admin/opportunities/${opportunityId}?created=1&translated=1`);
}
