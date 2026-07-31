"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type SubmitTalentRequestState = {
  success: boolean;
  message: string | null;
};

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitTalentRequestAction(
  _prevState: SubmitTalentRequestState,
  formData: FormData
): Promise<SubmitTalentRequestState> {
  const talentId = Number(formData.get("talent_id"));

  if (!Number.isFinite(talentId) || talentId <= 0) {
    return {
      success: false,
      message: "Invalid talent request.",
    };
  }

  const fullName = stringValue(formData, "full_name");
  const email = stringValue(formData, "email");
  const projectDetails = stringValue(formData, "project_details");

  if (!fullName || !email || !projectDetails) {
  return {
    success: false,
    message: "Name, email and project details are required.",
  };
}

  const supabase = createAdminClient();

  const { error } = await supabase.from("talent_requests").insert({
    talent_id: talentId,
    full_name: fullName,
    company: stringValue(formData, "company") || null,
    email,
    phone: stringValue(formData, "phone") || null,
    project_type: stringValue(formData, "project_type") || null,
    project_details: stringValue(formData, "project_details") || null,
    budget: stringValue(formData, "budget") || null,
    project_date: stringValue(formData, "project_date") || null,
    status: "new",
  });

  if (error) {
    console.error("[submitTalentRequestAction]", error.message);

    return {
      success: false,
      message: "Unable to submit request. Please try again.",
    };
  }

  return {
    success: true,
    message: "Request submitted successfully.",
  };
}