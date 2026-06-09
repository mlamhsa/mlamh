"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function numberValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? Number(value) : 0;
}

async function updateApplicationStatus(
  formData: FormData,
  status: "accepted" | "rejected"
) {
  const applicationId = numberValue(formData, "application_id");

  if (!applicationId) {
    throw new Error("Application ID is required.");
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("opportunity_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    throw new Error(`[updateApplicationStatus] ${error.message}`);
  }

  revalidatePath("/admin/opportunity-applications");
  revalidatePath("/talent-dashboard/requests");
}

export async function approveApplicationAction(formData: FormData) {
  await updateApplicationStatus(formData, "accepted");
}

export async function rejectApplicationAction(formData: FormData) {
  await updateApplicationStatus(formData, "rejected");
}