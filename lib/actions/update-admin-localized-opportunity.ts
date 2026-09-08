"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { translateOpportunityContent } from "@/lib/ai/translate-opportunity";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { requireAdminAccess } from "@/lib/auth/require-admin";
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

export async function updateAdminLocalizedOpportunityFormAction(formData: FormData) {
  await requireAdminAccess();

  const opportunityId = Number(formData.get("opportunity_id"));
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    throw new Error("Invalid opportunity id.");
  }

  const titleAr = stringValue(formData.get("title"));
  const descriptionAr = stringValue(formData.get("description"));
  if (!titleAr || !descriptionAr) throw new Error("عنوان ووصف الفرصة مطلوبان.");

  const db = createAdminClient();
  const { data: existing, error: readError } = await db
    .from("opportunities")
    .select("id,status,published,role_requirements")
    .eq("id", opportunityId)
    .single();
  if (readError || !existing) throw new Error("تعذر العثور على الفرصة.");

  const roleRequirements = existing.role_requirements && typeof existing.role_requirements === "object" && !Array.isArray(existing.role_requirements)
    ? existing.role_requirements as Record<string, unknown>
    : {};
  if (roleRequirements.managed_by !== "mlamh") throw new Error("Only MLAMH-managed opportunities can be edited here.");
  if (existing.published || !["draft", "needs_changes"].includes(existing.status)) {
    throw new Error("Only unpublished MLAMH-managed drafts can be edited here.");
  }

  const citySlug = stringValue(formData.get("city_slug"));
  const city = SAUDI_CITIES.find((item) => item.slug === citySlug) ?? null;
  if (!city) throw new Error("يرجى اختيار مدينة صحيحة.");

  const compensationRaw = stringValue(formData.get("compensation_type"));
  const compensationType: "fixed" | "negotiable" | "unpaid" =
    compensationRaw === "negotiable" || compensationRaw === "unpaid" ? compensationRaw : "fixed";
  const budget = compensationType === "fixed" ? stringValue(formData.get("budget")) || null : null;
  if (compensationType === "fixed" && !budget) throw new Error("أدخل مبلغ الفرصة.");

  const translated = await translateOpportunityContent({ sourceLanguage: "ar", title: titleAr, description: descriptionAr });
  const titleEn = translated.title.trim();
  const descriptionEn = translated.description.trim();
  if (!titleEn || !descriptionEn) throw new Error("تعذر إنشاء النسخة الإنجليزية للفرصة تلقائيًا.");

  const publishNow = formData.get("publish_now") === "true";
  const sourceType = roleRequirements.source_type === "client" ? "client" : "mlamh";
  const clientCompanyName = stringValue(formData.get("client_company_name"));
  const publicSourceModeRaw = stringValue(formData.get("public_source_mode"));
  const publicSourceMode = publicSourceModeRaw === "client_name" || publicSourceModeRaw === "mlamh_clients" ? publicSourceModeRaw : "mlamh";
  let companyName = "ملامح";
  if (sourceType === "client" && publicSourceMode === "client_name") {
    if (!clientCompanyName) throw new Error("اسم الجهة أو العميل مطلوب.");
    companyName = clientCompanyName;
  } else if (sourceType === "client" && publicSourceMode === "mlamh_clients") {
    companyName = "من عملاء ملامح";
  }

  const now = new Date().toISOString();
  const { error } = await db.from("opportunities").update({
    title: titleAr,
    description: descriptionAr,
    title_en: titleEn,
    description_en: descriptionEn,
    company_name: companyName,
    contact_name: sourceType === "client" ? stringValue(formData.get("contact_name")) || null : null,
    contact_phone: sourceType === "client" ? stringValue(formData.get("contact_phone")) || null : null,
    contact_email: sourceType === "client" ? stringValue(formData.get("contact_email")) || null : null,
    opportunity_type: formData.get("opportunity_type") === "actor" ? "actor" : "model",
    city_slug: city.slug,
    city_ar: city.ar,
    city_en: city.en,
    required_gender: formData.get("required_gender") === "male" ? "male" : formData.get("required_gender") === "female" ? "female" : "any",
    min_age: numberValue(formData.get("min_age")),
    max_age: numberValue(formData.get("max_age")),
    required_count: numberValue(formData.get("required_count")),
    compensation_type: compensationType,
    budget,
    application_days: numberValue(formData.get("application_days")),
    work_date: stringValue(formData.get("work_date")) || null,
    work_time: stringValue(formData.get("work_time")) || null,
    work_duration: stringValue(formData.get("work_duration")) || null,
    role_requirements: {
      ...roleRequirements,
      source_type: sourceType,
      public_source_mode: publicSourceMode,
      client_company_name: sourceType === "client" ? clientCompanyName : null,
      content_source_language: "ar",
      translation_mode: "automatic",
    },
    status: publishNow ? "published" : "draft",
    published: publishNow,
    updated_at: now,
  }).eq("id", opportunityId);
  if (error) throw new Error(`[update managed opportunity] ${error.message}`);

  revalidatePath(`/admin/opportunities/${opportunityId}`);
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/marketing/briefs");
  revalidatePath("/admin/marketing/leads");
  revalidatePath("/admin/marketing");
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
  revalidatePath("/ar");
  revalidatePath("/en");

  redirect(`/admin/opportunities/${opportunityId}?updated=1&lang=ar`);
}
