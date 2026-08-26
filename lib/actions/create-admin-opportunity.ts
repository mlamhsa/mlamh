"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type ManagedSourceType =
  | "mlamh"
  | "client";

export type CreateAdminOpportunityInput = {
  sourceType: ManagedSourceType;

  companyName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;

  postingMode?: "quick" | "project";

  title: string;
  description: string;
  opportunityType: "actor" | "model";

  citySlug?: string | null;
  cityAr?: string | null;
  cityEn?: string | null;

  requiredGender?: "any" | "male" | "female" | null;

  minAge?: number | null;
  maxAge?: number | null;

  budget?: string | null;
  compensationType?:
    | "fixed"
    | "negotiable"
    | "unpaid";

  applicationStartDate?: string | null;
  applicationDeadline?: string | null;
  applicationDays?: number | null;

  requiredCount?: number | null;

  workDate?: string | null;
  workTime?: string | null;
  workDuration?: string | null;

  roleRequirements?: Record<string, unknown> | null;

  publishNow?: boolean;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function createSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalized || "opportunity"}-${Date.now()}`;
}

export async function createAdminOpportunityAction(
  input: CreateAdminOpportunityInput,
) {
  await requireAdminAccess();

  const adminClient = createAdminClient();

  const title = cleanText(input.title);
  const description = cleanText(
    input.description,
  );

  if (!title) {
    throw new Error(
      "Opportunity title is required.",
    );
  }

  if (!description) {
    throw new Error(
      "Opportunity description is required.",
    );
  }

  if (
    input.opportunityType !== "actor" &&
    input.opportunityType !== "model"
  ) {
    throw new Error(
      "Invalid opportunity type.",
    );
  }

  const sourceType =
    input.sourceType === "client"
      ? "client"
      : "mlamh";

  const companyName =
    sourceType === "mlamh"
      ? "ملامح"
      : cleanText(input.companyName);

  if (!companyName) {
    throw new Error(
      "Client company name is required.",
    );
  }

  const publishNow =
    input.publishNow === true;

  const { data, error } =
    await adminClient
      .from("opportunities")
      .insert({
        publisher_id: null,

        posting_mode:
          input.postingMode === "quick"
            ? "quick"
            : "project",

        title,
        description,
        slug: createSlug(title),

        opportunity_type:
          input.opportunityType,

        city_slug:
          cleanText(input.citySlug) ||
          null,

        city_ar:
          cleanText(input.cityAr) ||
          null,

        city_en:
          cleanText(input.cityEn) ||
          null,

        required_gender:
          input.requiredGender ?? "any",

        min_age:
          Number.isInteger(input.minAge)
            ? input.minAge
            : null,

        max_age:
          Number.isInteger(input.maxAge)
            ? input.maxAge
            : null,

        budget:
          cleanText(input.budget) ||
          null,

        compensation_type:
          input.compensationType ??
          "fixed",

        company_name: companyName,

        contact_name:
          cleanText(input.contactName) ||
          null,

        contact_phone:
          cleanText(input.contactPhone) ||
          null,

        contact_email:
          cleanText(input.contactEmail) ||
          null,

        status: publishNow
          ? "published"
          : "draft",

        published: publishNow,

        application_start_date:
          cleanText(
            input.applicationStartDate,
          ) || null,

        application_deadline:
          cleanText(
            input.applicationDeadline,
          ) || null,

        application_days:
          Number.isInteger(
            input.applicationDays,
          )
            ? input.applicationDays
            : null,

        required_count:
          Number.isInteger(
            input.requiredCount,
          )
            ? input.requiredCount
            : null,

        work_date:
          cleanText(input.workDate) ||
          null,

        work_time:
          cleanText(input.workTime) ||
          null,

        work_duration:
          cleanText(
            input.workDuration,
          ) || null,

        role_requirements:
          input.roleRequirements ?? {},
      })
      .select(
        "id, title, slug, status, published",
      )
      .single();

  if (error) {
    console.error(
      "[createAdminOpportunityAction]",
      error,
    );

    throw new Error(
      error.message ||
        "Unable to create opportunity.",
    );
  }

  revalidatePath(
    "/admin/opportunities",
  );

  revalidatePath(
    "/ar/opportunities",
  );

  revalidatePath(
    "/en/opportunities",
  );

  revalidatePath("/ar");
  revalidatePath("/en");

  return {
    success: true,
    opportunity: data,
  };
}
export async function createAdminOpportunityFormAction(
  formData: FormData,
) {
  const stringValue = (
    value: FormDataEntryValue | null,
  ) =>
    typeof value === "string"
      ? value.trim()
      : "";

  const numberValue = (
    value: FormDataEntryValue | null,
  ) => {
    const raw = stringValue(value);

    if (!raw) {
      return null;
    }

    const parsed = Number(raw);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  };

  const sourceType =
    formData.get("source_type") === "client"
      ? "client"
      : "mlamh";

  const publicSourceModeRaw =
    stringValue(
      formData.get("public_source_mode"),
    );

  const publicSourceMode =
    publicSourceModeRaw === "client_name" ||
    publicSourceModeRaw === "mlamh_clients"
      ? publicSourceModeRaw
      : "mlamh";

  const citySlug = stringValue(
    formData.get("city_slug"),
  );

  const city =
    SAUDI_CITIES.find(
      (item) => item.slug === citySlug,
    ) ?? null;

  if (!city) {
    throw new Error(
      "يرجى اختيار مدينة صحيحة.",
    );
  }

  const clientCompanyName =
    stringValue(
      formData.get("client_company_name"),
    );

  let publicCompanyName = "ملامح";

  if (
    sourceType === "client" &&
    publicSourceMode === "client_name"
  ) {
    if (!clientCompanyName) {
      throw new Error(
        "اسم الجهة أو العميل مطلوب.",
      );
    }

    publicCompanyName =
      clientCompanyName;
  }

  if (
    sourceType === "client" &&
    publicSourceMode === "mlamh_clients"
  ) {
    publicCompanyName =
      "من عملاء ملامح";
  }

  const compensationRaw =
    stringValue(
      formData.get("compensation_type"),
    );

  const compensationType:
    | "fixed"
    | "negotiable"
    | "unpaid" =
    compensationRaw === "negotiable" ||
    compensationRaw === "unpaid"
      ? compensationRaw
      : "fixed";

  const budget =
    compensationType === "fixed"
      ? stringValue(
          formData.get("budget"),
        ) || null
      : null;

  if (
    compensationType === "fixed" &&
    !budget
  ) {
    throw new Error(
      "أدخل مبلغ الفرصة.",
    );
  }

  const result = await createAdminOpportunityAction({
    sourceType,

    companyName: publicCompanyName,

    contactName:
      sourceType === "client"
        ? stringValue(
            formData.get("contact_name"),
          ) || null
        : null,

    contactPhone:
      sourceType === "client"
        ? stringValue(
            formData.get("contact_phone"),
          ) || null
        : null,

    contactEmail:
      sourceType === "client"
        ? stringValue(
            formData.get("contact_email"),
          ) || null
        : null,

    postingMode: "project",

    title: stringValue(
      formData.get("title"),
    ),

    description: stringValue(
      formData.get("description"),
    ),

    opportunityType:
      formData.get("opportunity_type") ===
      "actor"
        ? "actor"
        : "model",

    citySlug: city.slug,
    cityAr: city.ar,
    cityEn: city.en,

    requiredGender:
      formData.get("required_gender") ===
      "male"
        ? "male"
        : formData.get(
              "required_gender",
            ) === "female"
          ? "female"
          : "any",

    minAge: numberValue(
      formData.get("min_age"),
    ),

    maxAge: numberValue(
      formData.get("max_age"),
    ),

    requiredCount: numberValue(
      formData.get("required_count"),
    ),

    compensationType,
    budget,

    applicationDays:
      numberValue(
        formData.get(
          "application_days",
        ),
      ),

    workDate:
      stringValue(
        formData.get("work_date"),
      ) || null,

    workTime:
      stringValue(
        formData.get("work_time"),
      ) || null,

    workDuration:
      stringValue(
        formData.get("work_duration"),
      ) || null,

    roleRequirements: {
      managed_by: "mlamh",
      source_type: sourceType,
      public_source_mode:
        publicSourceMode,

      client_company_name:
        sourceType === "client"
          ? clientCompanyName
          : null,
    },

    publishNow:
      formData.get("publish_now") ===
      "true",
  });
  if (result?.opportunity?.id) {
    redirect(
      `/admin/opportunities/${result.opportunity.id}?created=1`,
    );
  }
  
  redirect("/admin/opportunities?created=1");
}