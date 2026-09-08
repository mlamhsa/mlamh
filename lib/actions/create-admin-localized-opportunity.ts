"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { translateOpportunityContent } from "@/lib/ai/translate-opportunity";
import { createAdminOpportunityAction } from "@/lib/actions/create-admin-opportunity";
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

export async function createAdminLocalizedOpportunityFormAction(
  formData: FormData,
) {
  const titleAr = stringValue(formData.get("title"));
  const descriptionAr = stringValue(formData.get("description"));

  if (!titleAr || !descriptionAr) {
    throw new Error("عنوان ووصف الفرصة مطلوبان.");
  }

  const adminClient = createAdminClient();
  const marketingBriefIdRaw = Number(formData.get("marketing_brief_id"));
  const marketingBriefId = Number.isInteger(marketingBriefIdRaw) && marketingBriefIdRaw > 0
    ? marketingBriefIdRaw
    : null;
  let linkedLeadId: number | null = null;

  if (marketingBriefId) {
    const { data: brief, error: briefError } = await adminClient
      .from("marketing_briefs")
      .select("id,status,opportunity_id,lead_id")
      .eq("id", marketingBriefId)
      .single();

    if (briefError || !brief) {
      throw new Error("تعذر العثور على البريف المرتبط.");
    }
    if (brief.status !== "complete") {
      throw new Error("يجب أن يكون البريف مكتملًا قبل تحويله إلى فرصة.");
    }
    if (brief.opportunity_id) {
      throw new Error("هذا البريف مرتبط بفرصة بالفعل.");
    }

    linkedLeadId = typeof brief.lead_id === "number" ? brief.lead_id : null;
  }

  const translated = await translateOpportunityContent({
    sourceLanguage: "ar",
    title: titleAr,
    description: descriptionAr,
  });

  const titleEn = translated.title.trim();
  const descriptionEn = translated.description.trim();

  if (!titleEn || !descriptionEn) {
    throw new Error("تعذر إنشاء النسخة الإنجليزية للفرصة تلقائيًا. حاول مرة أخرى.");
  }

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

  const clientCompanyName = stringValue(
    formData.get("client_company_name"),
  );

  let publicCompanyName = "ملامح";

  if (sourceType === "client" && publicSourceMode === "client_name") {
    if (!clientCompanyName) {
      throw new Error("اسم الجهة أو العميل مطلوب.");
    }
    publicCompanyName = clientCompanyName;
  } else if (
    sourceType === "client" &&
    publicSourceMode === "mlamh_clients"
  ) {
    publicCompanyName = "من عملاء ملامح";
  }

  const citySlug = stringValue(formData.get("city_slug"));
  const city = SAUDI_CITIES.find((item) => item.slug === citySlug) ?? null;

  if (!city) {
    throw new Error("يرجى اختيار مدينة صحيحة.");
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

  const publishNow = formData.get("publish_now") === "true";

  // Always create as draft first so an opportunity is never public before
  // the translated fields are saved successfully.
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
      content_source_language: "ar",
      translation_mode: "automatic",
      marketing_brief_id: marketingBriefId,
    },
    publishNow: false,
  });

  const opportunityId = result?.opportunity?.id;

  if (!opportunityId) {
    throw new Error("تعذر إنشاء الفرصة.");
  }

  const { error } = await adminClient
    .from("opportunities")
    .update({
      title_en: titleEn,
      description_en: descriptionEn,
      status: publishNow ? "published" : "draft",
      published: publishNow,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);

  if (error) {
    throw new Error(
      `[createAdminLocalizedOpportunityFormAction] ${error.message}`,
    );
  }

  if (marketingBriefId) {
    const now = new Date().toISOString();
    const { error: briefLinkError } = await adminClient
      .from("marketing_briefs")
      .update({
        opportunity_id: opportunityId,
        status: "converted",
        updated_at: now,
      })
      .eq("id", marketingBriefId)
      .eq("status", "complete")
      .is("opportunity_id", null);

    if (briefLinkError) {
      throw new Error(`[link marketing brief] ${briefLinkError.message}`);
    }

    if (linkedLeadId) {
      const { error: leadError } = await adminClient
        .from("marketing_leads")
        .update({
          stage: "opportunity",
          brief_status: "complete",
          next_action_at: null,
          updated_at: now,
        })
        .eq("id", linkedLeadId);

      if (leadError) {
        throw new Error(`[advance marketing lead] ${leadError.message}`);
      }
    }
  }

  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/marketing/briefs");
  revalidatePath("/admin/marketing/leads");
  revalidatePath("/admin/marketing");
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
  revalidatePath("/ar");
  revalidatePath("/en");

  redirect(`/admin/opportunities/${opportunityId}?created=1&lang=ar`);
}
